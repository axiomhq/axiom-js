import { describe, expect, it } from 'vitest';
import { frameworkIdentifier, frameworkIdentifierFormatter } from '../../src/identifier';
import type { LogEvent } from '@axiomhq/logging';

describe('identifier', () => {
  it('exposes the react framework identifier', () => {
    expect(frameworkIdentifier.name).toBe('react-axiom-version');
    expect(typeof frameworkIdentifier.version).toBe('string');
    expect(frameworkIdentifier.version.length).toBeGreaterThan(0);
  });

  it('adds framework identifier without dropping existing app metadata', () => {
    const logEvent = {
      level: 'info',
      message: 'hello',
      fields: {},
      _time: new Date().toISOString(),
      '@app': {
        'axiom-logging-version': '0.0.0',
      },
      source: 'browser-log',
    } as LogEvent;

    const formatted = frameworkIdentifierFormatter(logEvent);

    expect(formatted['@app']['axiom-logging-version']).toBe('0.0.0');
    expect(formatted['@app'][frameworkIdentifier.name]).toBe(frameworkIdentifier.version);
  });
});
