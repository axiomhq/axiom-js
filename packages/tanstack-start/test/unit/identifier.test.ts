import { describe, expect, it, vi } from 'vitest';
import {
  appendTanStackStartAxiomClient,
  axiomClient,
  frameworkIdentifier,
  frameworkIdentifierFormatter,
} from '../../src/identifier';
import type { Logger } from '@axiomhq/logging';

describe('identifier', () => {
  it('exposes the tanstack framework identifier', () => {
    expect(frameworkIdentifier.name).toBe('tanstack-start-axiom-version');
    expect(typeof frameworkIdentifier.version).toBe('string');
    expect(frameworkIdentifier.version.length).toBeGreaterThan(0);
  });

  it('exposes the tanstack X-Axiom-Client product', () => {
    expect(axiomClient).toBe(`axiom-tanstack-start/${frameworkIdentifier.version}`);
  });

  it('appends the tanstack X-Axiom-Client product to supported loggers', () => {
    const logger = {
      appendAxiomClient: vi.fn(),
    } as unknown as Logger;

    appendTanStackStartAxiomClient(logger);

    expect((logger as any).appendAxiomClient).toHaveBeenCalledWith(axiomClient);
  });

  it('adds framework identifier without dropping existing app metadata', () => {
    const event = {
      level: 'info',
      message: 'hello',
      fields: {},
      _time: new Date().toISOString(),
      '@app': {
        'axiom-logging-version': '0.0.0',
      },
      source: 'browser-log',
    };

    const formatted = frameworkIdentifierFormatter(event);

    expect(formatted['@app']['axiom-logging-version']).toBe('0.0.0');
    expect(formatted['@app'][frameworkIdentifier.name]).toBe(frameworkIdentifier.version);
  });
});
