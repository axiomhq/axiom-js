import { describe, expect, it } from 'vitest';
import { resolveIngestUrl, validateUrlOrRegion } from '../../src/httpClient';
import { AxiomWithoutBatching } from '../../src/client';

describe('resolveIngestUrl', () => {
  describe('default behavior (no url, no region)', () => {
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

  describe('region configuration', () => {
    it('builds edge endpoint with region domain', () => {
      const url = resolveIngestUrl({ region: 'mumbai.axiom.co' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/ingest/test-dataset');
    });

    it('builds edge endpoint for AWS regional edge', () => {
      const url = resolveIngestUrl({ region: 'eu-central-1.aws.edge.axiom.co' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/my-dataset');
    });

    it('builds edge endpoint for staging environment', () => {
      const url = resolveIngestUrl({ region: 'us-east-1.edge.staging.axiomdomain.co' }, 'test-dataset');
      expect(url).toBe('https://us-east-1.edge.staging.axiomdomain.co/v1/ingest/test-dataset');
    });

    it('builds edge endpoint for dev environment', () => {
      const url = resolveIngestUrl({ region: 'eu-west-1.edge.dev.axiomdomain.co' }, 'dev-dataset');
      expect(url).toBe('https://eu-west-1.edge.dev.axiomdomain.co/v1/ingest/dev-dataset');
    });

    it('trims trailing slashes from region', () => {
      const url = resolveIngestUrl({ region: 'mumbai.axiom.co/' }, 'test-dataset');
      expect(url).toBe('https://mumbai.axiom.co/v1/ingest/test-dataset');
    });
  });

  describe('ingestUrl configuration', () => {
    it('appends dataset to ingestUrl', () => {
      const url = resolveIngestUrl({ ingestUrl: 'https://eu-central-1.aws.edge.axiom.co/v1/ingest' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/my-dataset');
    });

    it('trims trailing slashes from ingestUrl', () => {
      const url = resolveIngestUrl({ ingestUrl: 'https://edge.axiom.co/v1/ingest/' }, 'test');
      expect(url).toBe('https://edge.axiom.co/v1/ingest/test');
    });

    it('works with custom edge endpoints', () => {
      const url = resolveIngestUrl({ ingestUrl: 'https://my-custom-edge.example.com/ingest' }, 'logs');
      expect(url).toBe('https://my-custom-edge.example.com/ingest/logs');
    });
  });

  describe('priority: ingestUrl > url > region > default', () => {
    it('ingestUrl takes precedence over url', () => {
      const url = resolveIngestUrl(
        { ingestUrl: 'https://edge.axiom.co/v1/ingest', url: 'https://api.axiom.co' },
        'test'
      );
      expect(url).toBe('https://edge.axiom.co/v1/ingest/test');
    });

    it('ingestUrl takes precedence over region', () => {
      const url = resolveIngestUrl(
        { ingestUrl: 'https://edge.axiom.co/v1/ingest', region: 'mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('https://edge.axiom.co/v1/ingest/test');
    });

    it('url takes precedence over region when url has custom path', () => {
      const url = resolveIngestUrl(
        { url: 'http://localhost:3400/ingest', region: 'mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('url takes precedence over region when url has no path', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', region: 'mumbai.axiom.co' },
        'test'
      );
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/test/ingest');
    });
  });
});

describe('validateUrlOrRegion', () => {
  it('does not throw when no options are set', () => {
    expect(() => validateUrlOrRegion({})).not.toThrow();
  });

  it('does not throw when only url is set', () => {
    expect(() => validateUrlOrRegion({ url: 'https://api.axiom.co' })).not.toThrow();
  });

  it('does not throw when only region is set', () => {
    expect(() => validateUrlOrRegion({ region: 'mumbai.axiom.co' })).not.toThrow();
  });

  it('does not throw when only ingestUrl is set', () => {
    expect(() => validateUrlOrRegion({ ingestUrl: 'https://edge.axiom.co/v1/ingest' })).not.toThrow();
  });

  it('throws when both url and region are set', () => {
    expect(() =>
      validateUrlOrRegion({ url: 'https://api.axiom.co', region: 'mumbai.axiom.co' })
    ).toThrow('Cannot set multiple endpoint options');
  });

  it('throws when both url and ingestUrl are set', () => {
    expect(() =>
      validateUrlOrRegion({ url: 'https://api.axiom.co', ingestUrl: 'https://edge.axiom.co/v1/ingest' })
    ).toThrow('Cannot set multiple endpoint options');
  });

  it('throws when both region and ingestUrl are set', () => {
    expect(() =>
      validateUrlOrRegion({ region: 'mumbai.axiom.co', ingestUrl: 'https://edge.axiom.co/v1/ingest' })
    ).toThrow('Cannot set multiple endpoint options');
  });

  it('throws when all three options are set', () => {
    expect(() =>
      validateUrlOrRegion({ 
        url: 'https://api.axiom.co', 
        region: 'mumbai.axiom.co', 
        ingestUrl: 'https://edge.axiom.co/v1/ingest' 
      })
    ).toThrow('Cannot set multiple endpoint options');
  });
});

describe('AxiomWithoutBatching client endpoint options', () => {
  it('throws when both url and region are set in constructor', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.axiom.co',
        region: 'mumbai.axiom.co',
      })
    ).toThrow('Cannot set multiple endpoint options');
  });

  it('throws when both url and ingestUrl are set in constructor', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.axiom.co',
        ingestUrl: 'https://edge.axiom.co/v1/ingest',
      })
    ).toThrow('Cannot set multiple endpoint options');
  });

  it('accepts region without other options', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        region: 'mumbai.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts url without other options', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.eu.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts ingestUrl without other options', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        ingestUrl: 'https://edge.axiom.co/v1/ingest',
      })
    ).not.toThrow();
  });
});
