import type { Logger } from '@axiomhq/logging';
import { describe, expect, it, vi } from 'vitest';
import { appendNextJsAxiomClient, axiomClient, frameworkIdentifier, frameworkIdentifierFormatter } from '../../src/identifier';

describe('identifier', () => {
  it('exposes the nextjs framework identifier', () => {
    expect(frameworkIdentifier.name).toBe('next-axiom-version');
    expect(typeof frameworkIdentifier.version).toBe('string');
    expect(frameworkIdentifier.version.length).toBeGreaterThan(0);
  });

  it('exposes the nextjs X-Axiom-Client product', () => {
    expect(axiomClient).toBe(`axiom-nextjs/${frameworkIdentifier.version}`);
  });

  it('appends the nextjs X-Axiom-Client product to supported loggers', () => {
    const logger = {
      appendAxiomClient: vi.fn(),
    } as unknown as Logger;

    appendNextJsAxiomClient(logger);

    expect((logger as any).appendAxiomClient).toHaveBeenCalledWith(axiomClient);
  });

  it('adds framework identifier metadata to log events', () => {
    const event = {
      level: 'info',
      message: 'hello',
      fields: {},
      _time: new Date().toISOString(),
      '@app': {
        'axiom-logging-version': '0.0.0',
      },
      source: 'server-log',
    };

    const formatted = frameworkIdentifierFormatter(event);

    expect(formatted['@app'][frameworkIdentifier.name]).toBe(frameworkIdentifier.version);
  });
});
