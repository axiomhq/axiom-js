import { EVENT } from '@axiomhq/logging';
import type { RouterEvent, RouterEvents } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAxiomRouterObserver,
  getRouterPath,
  observeTanStackRouter,
  transformRouterNavigationResult,
  type RouterLike,
} from '../../src/router';
import { mockLogger } from '../lib/mock';

type RouterEventType = keyof RouterEvents;

const createMockRouter = (initialPath: string) => {
  const listeners = new Map<RouterEventType, Set<(event: RouterEvent) => void>>();

  const router: RouterLike = {
    state: {
      location: {
        href: `https://example.com${initialPath}`,
        pathname: initialPath,
      },
    } as RouterLike['state'],
    subscribe: ((eventType: RouterEventType, listener: (event: RouterEvent) => void) => {
      const listenersForEvent = listeners.get(eventType) ?? new Set<(event: RouterEvent) => void>();
      listenersForEvent.add(listener);
      listeners.set(eventType, listenersForEvent);

      return () => {
        listenersForEvent.delete(listener);
      };
    }) as RouterLike['subscribe'],
  };

  const emit = (eventType: RouterEventType, nextPath: string) => {
    const fromLocation = (router.state.location ?? {
      href: `https://example.com${nextPath}`,
      pathname: nextPath,
    }) as RouterEvent['toLocation'];

    const toLocation = {
      href: `https://example.com${nextPath}`,
      pathname: nextPath,
    } as RouterEvent['toLocation'];

    ((router.state as unknown) as Record<string, unknown>).location = toLocation;

    const event = {
      type: eventType,
      fromLocation,
      toLocation,
      pathChanged: fromLocation.pathname !== toLocation.pathname,
      hrefChanged: fromLocation.href !== toLocation.href,
      hashChanged: false,
    } as RouterEvents[RouterEventType];

    const targetListeners = listeners.get(eventType);
    targetListeners?.forEach((listener) => listener(event));
  };

  return { router, emit };
};

describe('router observers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transforms navigation data into an event payload', () => {
    const [message, report] = transformRouterNavigationResult({
      from: '/from',
      to: '/to',
      timestamp: 123,
    });

    expect(message).toBe('Navigation from /from to /to');
    expect(report).toEqual({
      from: '/from',
      to: '/to',
      [EVENT]: {
        source: 'tanstack-router',
        navigation: {
          timestamp: 123,
        },
      },
    });
  });

  it('observes onResolved navigation and skips unchanged paths by default', () => {
    const { router, emit } = createMockRouter('/first');

    const observe = observeTanStackRouter(mockLogger);
    const unsubscribe = observe(router);

    emit('onResolved', '/second');
    emit('onResolved', '/second');

    expect(mockLogger.info).toHaveBeenCalledTimes(1);

    const [message, report] = vi.mocked(mockLogger.info).mock.calls[0] as [string, Record<string | symbol, unknown>];

    expect(message).toContain('Navigation from /first to /second');
    expect(report[EVENT]).toEqual(
      expect.objectContaining({
        source: 'tanstack-router',
      }),
    );

    unsubscribe();
    emit('onResolved', '/third');

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });

  it('supports custom event type, source, message and flush behavior', () => {
    const { router, emit } = createMockRouter('/one');

    const observe = observeTanStackRouter(mockLogger, {
      eventType: 'onLoad',
      flushOnNavigation: true,
      logUnchangedNavigations: true,
      source: 'custom-source',
      getMessage: (data) => `Custom navigation to ${data.to}`,
    });
    observe(router);

    emit('onResolved', '/two');
    emit('onLoad', '/two');
    emit('onLoad', '/two');

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.flush).toHaveBeenCalledTimes(2);

    const [, report] = vi.mocked(mockLogger.info).mock.calls[0] as [string, Record<string | symbol, unknown>];
    expect(report[EVENT]).toEqual(
      expect.objectContaining({
        source: 'custom-source',
      }),
    );
  });

  it('creates an observer factory via createAxiomRouterObserver', () => {
    const { router, emit } = createMockRouter('/factory');

    const observe = createAxiomRouterObserver(mockLogger);
    const unsubscribe = observe(router);

    emit('onResolved', '/next');
    expect(mockLogger.info).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('extracts path from router state location', () => {
    const { router } = createMockRouter('/path-from-state');

    expect(getRouterPath(router)).toBe('/path-from-state');
  });
});
