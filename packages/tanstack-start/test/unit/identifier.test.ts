import { describe, expect, it } from 'vitest';
import { frameworkIdentifier, frameworkIdentifierFormatter } from '../../src/identifier';

describe('identifier', () => {
  it('exposes the tanstack framework identifier', () => {
    expect(frameworkIdentifier.name).toBe('tanstack-start-axiom-version');
    expect(typeof frameworkIdentifier.version).toBe('string');
    expect(frameworkIdentifier.version.length).toBeGreaterThan(0);
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
