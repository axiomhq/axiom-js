import { describe, expect, it } from 'vitest';
import { resolveIngestUrl, validateUrlOrRegion } from '../../src/httpClient';
import { AxiomWithoutBatching } from '../../src/client';

describe('resolveIngestUrl', () => {
  describe('default behavior (no url, no edgeUrl)', () => {
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

    it('preserves query params when url has no path', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co?org=my-org' }, 'qoo');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/qoo/ingest?org=my-org');
    });

    it('preserves query params when url has custom path', () => {
      const url = resolveIngestUrl({ url: 'http://localhost:3400/ingest?debug=true' }, 'meh');
      expect(url).toBe('http://localhost:3400/ingest?debug=true');
    });

    it('preserves fragment when url has no path', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co#section' }, 'qoo');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/qoo/ingest#section');
    });

    it('preserves both query params and fragment', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co?org=test#section' }, 'qoo');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/qoo/ingest?org=test#section');
    });
  });

  describe('edgeUrl configuration', () => {
    it('appends legacy path format when edgeUrl has no path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://mumbai.axiom.co' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/datasets/test-dataset/ingest');
    });

    it('appends legacy path format for AWS regional edge', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/datasets/my-dataset/ingest');
    });

    it('appends legacy path format for staging environment', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://us-east-1.edge.staging.axiomdomain.co' }, 'test-dataset');
      expect(url).toBe('https://us-east-1.edge.staging.axiomdomain.co/v1/datasets/test-dataset/ingest');
    });

    it('appends legacy path format for dev environment', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-west-1.edge.dev.axiomdomain.co' }, 'dev-dataset');
      expect(url).toBe('https://eu-west-1.edge.dev.axiomdomain.co/v1/datasets/dev-dataset/ingest');
    });

    it('trims trailing slashes from edgeUrl', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://mumbai.axiom.co/' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/datasets/test-dataset/ingest');
    });

    it('uses edgeUrl as-is when it has a custom path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://mumbai.axiom.co/custom/path' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/custom/path');
    });

    it('preserves query params when edgeUrl has no path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://mumbai.axiom.co?org=my-org' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/datasets/test-dataset/ingest?org=my-org');
    });
  });

  describe('priority: url > edgeUrl > default', () => {
    it('url takes precedence over edgeUrl when url has custom path', () => {
      const url = resolveIngestUrl(
        { url: 'http://localhost:3400/ingest', edgeUrl: 'https://mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('url takes precedence over edgeUrl when url has no path', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', edgeUrl: 'https://mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/test/ingest');
    });
  });
});

describe('validateUrlOrRegion', () => {
  it('does not throw when neither url nor edgeUrl is set', () => {
    expect(() => validateUrlOrRegion({})).not.toThrow();
  });

  it('does not throw when only url is set', () => {
    expect(() => validateUrlOrRegion({ url: 'https://api.axiom.co' })).not.toThrow();
  });

  it('does not throw when only edgeUrl is set', () => {
    expect(() => validateUrlOrRegion({ edgeUrl: 'https://mumbai.axiom.co' })).not.toThrow();
  });

  it('throws when both url and edgeUrl are set', () => {
    expect(() =>
      validateUrlOrRegion({ url: 'https://api.axiom.co', edgeUrl: 'https://mumbai.axiom.co' })
    ).toThrow('Cannot set both `url` and `edgeUrl`. Please use only one.');
  });
});

describe('AxiomWithoutBatching client endpoint options', () => {
  it('throws when both url and edgeUrl are set in constructor', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.axiom.co',
        edgeUrl: 'https://mumbai.axiom.co',
      })
    ).toThrow('Cannot set both `url` and `edgeUrl`. Please use only one.');
  });

  it('accepts edgeUrl without url', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        edgeUrl: 'https://mumbai.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts url without edgeUrl', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.eu.axiom.co',
      })
    ).not.toThrow();
  });
});
