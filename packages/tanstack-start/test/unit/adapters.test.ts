import { EVENT } from '@axiomhq/logging';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAxiomReactErrorHandler } from '../../src/react';
import { createAxiomSolidErrorHandler } from '../../src/solid';
import { mockLogger } from '../lib/mock';

describe('framework adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs React error-boundary errors through the React adapter', () => {
    const handleError = createAxiomReactErrorHandler(mockLogger);

    handleError(new Error('react boom'), {
      componentStack: '\n    in Widget',
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'react boom (react)',
      expect.objectContaining({
        componentStack: '\n    in Widget',
        [EVENT]: expect.objectContaining({
          source: 'tanstack-start-react-error-boundary',
          client: expect.objectContaining({
            framework: 'react',
          }),
        }),
      }),
    );
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('logs TanStack Router React boundary errors without requiring component stack metadata', () => {
    const handleError = createAxiomReactErrorHandler(mockLogger);

    handleError(new Error('react route boom'));

    expect(mockLogger.error).toHaveBeenCalledWith(
      'react route boom (react)',
      expect.objectContaining({
        componentStack: undefined,
        [EVENT]: expect.objectContaining({
          source: 'tanstack-start-react-error-boundary',
          client: expect.objectContaining({
            framework: 'react',
          }),
        }),
      }),
    );
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('logs Solid error-boundary errors through the Solid adapter', () => {
    const handleError = createAxiomSolidErrorHandler(mockLogger);

    handleError(new Error('solid boom'));

    expect(mockLogger.error).toHaveBeenCalledWith(
      'solid boom (solid)',
      expect.objectContaining({
        [EVENT]: expect.objectContaining({
          source: 'tanstack-start-solid-error-boundary',
          client: expect.objectContaining({
            framework: 'solid',
          }),
        }),
      }),
    );
    expect(mockLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('keeps router exports off the root module and available on explicit subpaths', async () => {
    const rootExports = await import('../../src/index');
    const routerExports = await import('../../src/router');
    const reactExports = await import('../../src/react');
    const solidExports = await import('../../src/solid');

    expect(rootExports).not.toHaveProperty('observeTanStackRouter');
    expect(rootExports).not.toHaveProperty('tanStackRouterFormatters');
    expect(rootExports).toHaveProperty('createAxiomRequestMiddleware');
    expect(rootExports).toHaveProperty('tanStackStartClientFormatters');

    expect(routerExports).toHaveProperty('observeTanStackRouter');
    expect(routerExports).toHaveProperty('tanStackRouterFormatters');
    expect(reactExports).toHaveProperty('createAxiomReactErrorHandler');
    expect(solidExports).toHaveProperty('createAxiomSolidErrorHandler');
  });
});
