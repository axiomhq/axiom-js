import { describe, expect, it } from 'vitest';
import { resolveIngestUrl, validateUrlOrRegion } from '../../src/httpClient';
import { AxiomWithoutBatching } from '../../src/client';

describe('resolveIngestUrl', () => {
  describe('default behavior (no url, no edgeRegion)', () => {
    it('uses cloud endpoint with legacy path format', () => {
      const url = resolveIngestUrl({}, 'my-dataset');
      expect(url).toBe('https://api.axiom.co/v1/datasets/my-dataset/ingest');
    });
  });

  describe('url configuration', () => {
    it('appends legacy path format when url has no path', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co' }, 'qoo');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/qoo/ingest');
    });

    it('appends legacy path format when url has trailing slash only', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co/' }, 'qoo');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/qoo/ingest');
    });

    it('uses url as-is when it has a custom path', () => {
      const url = resolveIngestUrl({ url: 'http://localhost:3400/ingest' }, 'meh');
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('uses url as-is when it has a deep custom path', () => {
      const url = resolveIngestUrl({ url: 'http://localhost:3400/v1/custom/ingest' }, 'meh');
      expect(url).toBe('http://localhost:3400/v1/custom/ingest');
    });

    it('trims trailing slashes from url with custom path', () => {
      const url = resolveIngestUrl({ url: 'http://localhost:3400/ingest/' }, 'meh');
      expect(url).toBe('http://localhost:3400/ingest');
    });
  });

  describe('edgeRegion configuration', () => {
    it('builds edge endpoint with edgeRegion domain', () => {
      const url = resolveIngestUrl({ edgeRegion: 'mumbai.axiom.co' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/ingest/test-dataset');
    });

    it('builds edge endpoint for AWS regional edge', () => {
      const url = resolveIngestUrl({ edgeRegion: 'eu-central-1.aws.edge.axiom.co' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/my-dataset');
    });

    it('builds edge endpoint for staging environment', () => {
      const url = resolveIngestUrl({ edgeRegion: 'us-east-1.edge.staging.axiomdomain.co' }, 'test-dataset');
      expect(url).toBe('https://us-east-1.edge.staging.axiomdomain.co/v1/ingest/test-dataset');
    });

    it('builds edge endpoint for dev environment', () => {
      const url = resolveIngestUrl({ edgeRegion: 'eu-west-1.edge.dev.axiomdomain.co' }, 'dev-dataset');
      expect(url).toBe('https://eu-west-1.edge.dev.axiomdomain.co/v1/ingest/dev-dataset');
    });

    it('trims trailing slashes from edgeRegion', () => {
      const url = resolveIngestUrl({ edgeRegion: 'mumbai.axiom.co/' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/ingest/test-dataset');
    });
  });

  describe('priority: url > edgeRegion > default', () => {
    it('url takes precedence over edgeRegion when url has custom path', () => {
      const url = resolveIngestUrl(
        { url: 'http://localhost:3400/ingest', edgeRegion: 'mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('url takes precedence over edgeRegion when url has no path', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', edgeRegion: 'mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/test/ingest');
    });
  });
});

describe('validateUrlOrRegion', () => {
  it('does not throw when neither url nor edgeRegion is set', () => {
    expect(() => validateUrlOrRegion({})).not.toThrow();
  });

  it('does not throw when only url is set', () => {
    expect(() => validateUrlOrRegion({ url: 'https://api.axiom.co' })).not.toThrow();
  });

  it('does not throw when only edgeRegion is set', () => {
    expect(() => validateUrlOrRegion({ edgeRegion: 'mumbai.axiom.co' })).not.toThrow();
  });

  it('throws when both url and edgeRegion are set', () => {
    expect(() =>
      validateUrlOrRegion({ url: 'https://api.axiom.co', edgeRegion: 'mumbai.axiom.co' })
    ).toThrow('Cannot set both `url` and `edgeRegion`. Please use only one.');
  });
});

describe('AxiomWithoutBatching client endpoint options', () => {
  it('throws when both url and edgeRegion are set in constructor', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.axiom.co',
        edgeRegion: 'mumbai.axiom.co',
      })
    ).toThrow('Cannot set both `url` and `edgeRegion`. Please use only one.');
  });

  it('accepts edgeRegion without url', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        edgeRegion: 'mumbai.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts url without edgeRegion', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.eu.axiom.co',
      })
    ).not.toThrow();
  });
});
