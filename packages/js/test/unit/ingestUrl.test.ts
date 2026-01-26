import { describe, expect, it } from 'vitest';
import { resolveIngestUrl } from '../../src/httpClient';
import { AxiomWithoutBatching } from '../../src/client';

describe('resolveIngestUrl', () => {
  describe('default behavior (no url, no edge options)', () => {
    it('uses cloud endpoint with legacy path format', () => {
      const url = resolveIngestUrl({}, 'my-dataset');
      expect(url).toBe('https://api.axiom.co/v1/datasets/my-dataset/ingest');
    });
  });

  describe('url configuration (legacy path format)', () => {
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

  describe('edge configuration (domain only)', () => {
    it('builds edge URL with edge path format', () => {
      const url = resolveIngestUrl({ edge: 'eu-central-1.aws.edge.axiom.co' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/my-dataset');
    });

    it('builds edge URL for different regions', () => {
      const url = resolveIngestUrl({ edge: 'ap-south-1.aws.edge.axiom.co' }, 'test-dataset');
      expect(url).toBe('https://ap-south-1.aws.edge.axiom.co/v1/ingest/test-dataset');
    });
  });

  describe('edgeUrl configuration (full URL, edge path format)', () => {
    it('uses edge path format when edgeUrl has no path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co' }, 'my-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/my-dataset');
    });

    it('uses edge path format for staging environment', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://us-east-1.edge.staging.axiomdomain.co' }, 'test-dataset');
      expect(url).toBe('https://us-east-1.edge.staging.axiomdomain.co/v1/ingest/test-dataset');
    });

    it('uses edge path format for dev environment', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-west-1.edge.dev.axiomdomain.co' }, 'dev-dataset');
      expect(url).toBe('https://eu-west-1.edge.dev.axiomdomain.co/v1/ingest/dev-dataset');
    });

    it('trims trailing slashes from edgeUrl', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co/' }, 'test-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test-dataset');
    });

    it('uses edgeUrl as-is when it has a custom path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'http://localhost:3400/custom/ingest' }, 'test-dataset');
      expect(url).toBe('http://localhost:3400/custom/ingest');
    });

    it('preserves query params when edgeUrl has no path', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co?org=my-org' }, 'test-dataset');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test-dataset?org=my-org');
    });
  });

  describe('smart path handling (custom path used as-is)', () => {
    it('edgeUrl with custom path is used as-is', () => {
      const url = resolveIngestUrl({ edgeUrl: 'http://localhost:3400/ingest' }, 'test');
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('edgeUrl with deep custom path is used as-is', () => {
      const url = resolveIngestUrl({ edgeUrl: 'http://localhost:3400/v1/custom/ingest' }, 'test');
      expect(url).toBe('http://localhost:3400/v1/custom/ingest');
    });

    it('edgeUrl without path uses edge format', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co' }, 'test');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test');
    });

    it('edgeUrl with only trailing slash uses edge format', () => {
      const url = resolveIngestUrl({ edgeUrl: 'https://eu-central-1.aws.edge.axiom.co/' }, 'test');
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test');
    });

    it('url with custom path is used as-is', () => {
      const url = resolveIngestUrl({ url: 'http://localhost:3400/ingest' }, 'test');
      expect(url).toBe('http://localhost:3400/ingest');
    });

    it('url without path uses legacy format', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co' }, 'test');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/test/ingest');
    });

    it('url with only trailing slash uses legacy format', () => {
      const url = resolveIngestUrl({ url: 'https://api.eu.axiom.co/' }, 'test');
      expect(url).toBe('https://api.eu.axiom.co/v1/datasets/test/ingest');
    });
  });

  describe('priority: edgeUrl > edge > url > default', () => {
    it('edgeUrl takes precedence over edge', () => {
      const url = resolveIngestUrl(
        { edge: 'ap-south-1.aws.edge.axiom.co', edgeUrl: 'https://eu-central-1.aws.edge.axiom.co' },
        'test'
      );
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test');
    });

    it('edgeUrl takes precedence over url', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', edgeUrl: 'https://eu-central-1.aws.edge.axiom.co' },
        'test'
      );
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test');
    });

    it('edge takes precedence over url', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', edge: 'eu-central-1.aws.edge.axiom.co' },
        'test'
      );
      expect(url).toBe('https://eu-central-1.aws.edge.axiom.co/v1/ingest/test');
    });

    it('edgeUrl with custom path takes precedence', () => {
      const url = resolveIngestUrl(
        { url: 'https://api.eu.axiom.co', edge: 'ap-south-1.aws.edge.axiom.co', edgeUrl: 'http://localhost:3400/custom' },
        'test'
      );
      expect(url).toBe('http://localhost:3400/custom');
    });
  });
});

describe('AxiomWithoutBatching client endpoint options', () => {
  it('accepts url, edge, and edgeUrl together', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.axiom.co',
        edge: 'eu-central-1.aws.edge.axiom.co',
        edgeUrl: 'https://eu-central-1.aws.edge.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts edge without url', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        edge: 'eu-central-1.aws.edge.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts edgeUrl without url', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        edgeUrl: 'https://eu-central-1.aws.edge.axiom.co',
      })
    ).not.toThrow();
  });

  it('accepts url without edge options', () => {
    expect(() =>
      new AxiomWithoutBatching({
        token: 'test-token',
        url: 'https://api.eu.axiom.co',
      })
    ).not.toThrow();
  });
});
