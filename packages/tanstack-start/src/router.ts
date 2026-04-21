import { EVENT, Logger, type Formatter } from '@axiomhq/logging';
import type { AnyRouter, RouterEvent, RouterEvents } from '@tanstack/router-core';
import { frameworkIdentifierFormatter } from './identifier';

const ROUTER_SOURCE = 'tanstack-router';
const DEFAULT_EVENT: keyof RouterEvents = 'onResolved';

type LogReport = Record<string | symbol, unknown>;

export type RouterPerformanceStartEventType = 'onBeforeNavigate' | 'onBeforeLoad';
export type RouterPerformanceEndEventType = 'onLoad' | 'onResolved' | 'onRendered';

export interface RouterLocationLike {
  href?: string;
  pathname?: string;
}

export type RouterLike = Pick<AnyRouter, 'state' | 'subscribe'>;

export interface RouterNavigationData {
  from?: string;
  to?: string;
  timestamp: number;
}

export interface RouterPerformanceData extends RouterNavigationData {
  durationMs: number;
  endTime: number;
  endEventType: RouterPerformanceEndEventType;
  startEventType: RouterPerformanceStartEventType;
  startTime: number;
}

export interface RouterPerformanceOptions {
  enabled?: boolean;
  endEventType?: RouterPerformanceEndEventType;
  getMessage?: (data: RouterPerformanceData, event: RouterEvent) => string;
  source?: string;
  startEventType?: RouterPerformanceStartEventType;
}

export interface RouterObserverOptions {
  eventType?: keyof RouterEvents;
  flushOnNavigation?: boolean;
  getMessage?: (data: RouterNavigationData, event: RouterEvent) => string;
  getPath?: (router: RouterLike, event: RouterEvent) => string | undefined;
  logUnchangedNavigations?: boolean;
  performance?: boolean | RouterPerformanceOptions;
  source?: string;
}

interface ActiveNavigationTiming {
  from?: string;
  startEventType: RouterPerformanceStartEventType;
  startTime: number;
  to?: string;
}

interface ResolvedRouterPerformanceOptions {
  endEventType: RouterPerformanceEndEventType;
  getMessage?: RouterPerformanceOptions['getMessage'];
  source: string;
  startEventType: RouterPerformanceStartEventType;
}

export const tanStackRouterFormatters: Formatter[] = [frameworkIdentifierFormatter];

const locationToPath = (location: RouterLocationLike | undefined) => {
  if (!location) {
    return undefined;
  }

  if (location.href) {
    try {
      return new URL(location.href).pathname;
    } catch {
      return location.href;
    }
  }

  if (location.pathname) {
    return location.pathname;
  }

  return undefined;
};

const getEventPath = (event: RouterEvent) => {
  return locationToPath(event.toLocation);
};

export const getRouterPath = (router: RouterLike) => {
  return locationToPath(router.state.location);
};

export const transformRouterNavigationResult = (
  data: RouterNavigationData,
  source = ROUTER_SOURCE,
  getMessage?: RouterObserverOptions['getMessage'],
  event?: RouterEvent,
): [message: string, report: LogReport] => {
  const message =
    getMessage?.(data, event as RouterEvent) ??
    `Navigation ${data.from ? `from ${data.from}` : 'from <initial>'} to ${data.to ?? '<unknown>'}`;

  return [
    message,
    {
      from: data.from,
      to: data.to,
      [EVENT]: {
        source,
        navigation: {
          timestamp: data.timestamp,
        },
      },
    },
  ];
};

export const transformRouterPerformanceResult = (
  data: RouterPerformanceData,
  source = `${ROUTER_SOURCE}-timing`,
  getMessage?: RouterPerformanceOptions['getMessage'],
  event?: RouterEvent,
): [message: string, report: LogReport] => {
  const message =
    getMessage?.(data, event as RouterEvent) ??
    `Navigation ${data.to ?? '<unknown>'} completed in ${data.durationMs}ms`;

  return [
    message,
    {
      from: data.from,
      to: data.to,
      [EVENT]: {
        source,
        navigation: {
          durationMs: data.durationMs,
          endEventType: data.endEventType,
          endTime: data.endTime,
          startEventType: data.startEventType,
          startTime: data.startTime,
          timestamp: data.endTime,
        },
      },
    },
  ];
};

const resolvePerformanceOptions = (
  source: string,
  performance: RouterObserverOptions['performance'],
): ResolvedRouterPerformanceOptions | undefined => {
  if (!performance) {
    return undefined;
  }

  if (performance === true) {
    return {
      endEventType: 'onResolved',
      getMessage: undefined,
      source: `${source}-timing`,
      startEventType: 'onBeforeNavigate',
    };
  }

  if (performance.enabled === false) {
    return undefined;
  }

  return {
    endEventType: performance.endEventType ?? 'onResolved',
    getMessage: performance.getMessage,
    source: performance.source ?? `${source}-timing`,
    startEventType: performance.startEventType ?? 'onBeforeNavigate',
  };
};

const flushLogger = (logger: Logger, flushOnNavigation: boolean) => {
  if (flushOnNavigation) {
    void logger.flush();
  }
};

const observeRouter = (router: RouterLike, logger: Logger, options: RouterObserverOptions = {}) => {
  const {
    eventType = DEFAULT_EVENT,
    flushOnNavigation = false,
    getMessage,
    logUnchangedNavigations = false,
    source = ROUTER_SOURCE,
    getPath,
  } = options;

  const resolvePath =
    getPath ?? ((nextRouter: RouterLike, event: RouterEvent) => getEventPath(event) ?? getRouterPath(nextRouter));

  const performance = resolvePerformanceOptions(source, options.performance);
  const unsubscribers: Array<() => void> = [];
  let activeTiming: ActiveNavigationTiming | undefined;
  let previousPath = getRouterPath(router);

  unsubscribers.push(
    router.subscribe(eventType, (event: RouterEvent) => {
      const nextPath = resolvePath(router, event);

      if (!nextPath) {
        return;
      }

      if (!logUnchangedNavigations && previousPath === nextPath) {
        return;
      }

      const navigation = {
        from: previousPath,
        to: nextPath,
        timestamp: Date.now(),
      } satisfies RouterNavigationData;

      const [message, report] = transformRouterNavigationResult(navigation, source, getMessage, event);
      logger.info(message, report);
      flushLogger(logger, flushOnNavigation);

      previousPath = nextPath;
    }),
  );

  if (performance) {
    unsubscribers.push(
      router.subscribe(performance.startEventType, (event: RouterEvent) => {
        const nextPath = resolvePath(router, event);

        if (!nextPath) {
          activeTiming = undefined;
          return;
        }

        const fromPath = locationToPath(event.fromLocation);
        if (!logUnchangedNavigations && fromPath === nextPath) {
          activeTiming = undefined;
          return;
        }

        activeTiming = {
          from: fromPath,
          startEventType: performance.startEventType,
          startTime: Date.now(),
          to: nextPath,
        };
      }),
    );

    unsubscribers.push(
      router.subscribe(performance.endEventType, (event: RouterEvent) => {
        const nextPath = resolvePath(router, event);
        if (!activeTiming || !nextPath) {
          return;
        }

        if (activeTiming.to && activeTiming.to !== nextPath) {
          return;
        }

        const endTime = Date.now();
        const timing = {
          durationMs: endTime - activeTiming.startTime,
          endEventType: performance.endEventType,
          endTime,
          from: activeTiming.from,
          startEventType: activeTiming.startEventType,
          startTime: activeTiming.startTime,
          timestamp: endTime,
          to: nextPath,
        } satisfies RouterPerformanceData;

        const [message, report] = transformRouterPerformanceResult(
          timing,
          performance.source,
          performance.getMessage,
          event,
        );

        logger.info(message, report);
        flushLogger(logger, flushOnNavigation);
        activeTiming = undefined;
      }),
    );
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

export const observeTanStackRouter = (logger: Logger, options: RouterObserverOptions = {}) => {
  return (router: RouterLike) => observeRouter(router, logger, options);
};
