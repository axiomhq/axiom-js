import { EVENT, Logger } from '@axiomhq/logging';
import type { AnyRouter, RouterEvent, RouterEvents } from '@tanstack/react-router';

const ROUTER_SOURCE = 'tanstack-router';
const DEFAULT_EVENT: keyof RouterEvents = 'onResolved';

type LogReport = Record<string | symbol, unknown>;

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

export interface RouterObserverOptions {
  eventType?: keyof RouterEvents;
  flushOnNavigation?: boolean;
  logUnchangedNavigations?: boolean;
  source?: string;
  getPath?: (router: RouterLike, event: RouterEvent) => string | undefined;
  getMessage?: (data: RouterNavigationData, event: RouterEvent) => string;
}

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

const observeRouter = (router: RouterLike, logger: Logger, options: RouterObserverOptions = {}) => {
  const {
    eventType = DEFAULT_EVENT,
    flushOnNavigation = false,
    logUnchangedNavigations = false,
    source = ROUTER_SOURCE,
    getPath,
    getMessage,
  } = options;

  const resolvePath =
    getPath ?? ((nextRouter: RouterLike, event: RouterEvent) => getEventPath(event) ?? getRouterPath(nextRouter));

  let previousPath = getRouterPath(router);

  return router.subscribe(eventType, (event) => {
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

    if (flushOnNavigation) {
      void logger.flush();
    }

    previousPath = nextPath;
  });
};

export const observeTanStackRouter = (logger: Logger, options: RouterObserverOptions = {}) => {
  return (router: RouterLike) => observeRouter(router, logger, options);
};

export const createAxiomRouterObserver = (logger: Logger, options: RouterObserverOptions = {}) => {
  return observeTanStackRouter(logger, options);
};
