import { describe, expect, it } from 'vitest';

import { AxiomWithoutBatching } from '../../src/client';
import { testMockedFetchCall } from '../lib/mock';

const defaultApiUrl = 'https://api.axiom.co';
const customApiUrl = 'http://axiom-js-query.dev.local';
const customQueryPath = 'http://axiom-js-query.dev.local/query-proxy';
const edgeDomain = 'eu-central-1.aws.edge.axiom.co';
const edgeUrl = 'https://eu-central-1.aws.edge.axiom.co';
const queryResult = {
  buckets: {
    series: [],
    totals: [],
  },
  datasetNames: ['test'],
  matches: [],
  request: {
    startTime: 'now-1h',
    endTime: 'now',
    resolution: 'auto',
  },
  status: {
    elapsedTime: 1,
    blocksExamined: 1,
    rowsExamined: 1,
    rowsMatched: 1,
    numGroups: 0,
    isPartial: false,
    cacheStatus: 0,
    minBlockTime: '2026-06-02T00:00:00Z',
    maxBlockTime: '2026-06-02T00:00:01Z',
  },
};
const metricsResult = {
  status: {
    elapsedTime: 1,
  },
  tables: [],
};

describe('APL query URL behavior', () => {
  it('uses the default API base for APL queries without url or edge options', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token' });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${defaultApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('keeps APL query options in the configured API URL when edge routing is absent', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: `${customApiUrl}/` });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(
        `${customApiUrl}/v1/datasets/_apl?streaming-duration=1m&nocache=true&format=legacy&cursor=abc123`,
      );
    }, queryResult);

    await client.query("['test'] | count", {
      cursor: 'abc123',
      noCache: true,
      streamingDuration: '1m',
    });
  });

  it('routes APL queries through the configured edge domain', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edge: edgeDomain });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`https://${edgeDomain}/v1/query/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('prefers edgeUrl over edge and url for APL query routing', async () => {
    const client = new AxiomWithoutBatching({
      token: 'test-token',
      url: customApiUrl,
      edge: edgeDomain,
      edgeUrl,
    });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${edgeUrl}/v1/query/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('applies APL query routing through aplQuery', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edge: edgeDomain });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`https://${edgeDomain}/v1/query/_apl?format=legacy`);
    }, queryResult);

    await client.aplQuery("['test'] | count");
  });

  it('defaults to APL when a metrics-looking query has no MPL type', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${customApiUrl}/v1/datasets/_apl?format=legacy`);
      expect(init.body).toEqual(
        JSON.stringify({
          apl: 'metrics:http_requests_total',
          startTime: 'now-1h',
          endTime: 'now',
        }),
      );
    }, queryResult);

    await client.query('metrics:http_requests_total', {
      startTime: 'now-1h',
      endTime: 'now',
    });
  });

  it('keeps custom edgeUrl paths as-is for APL queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edgeUrl: `${customQueryPath}/` });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${customQueryPath}?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });
});

describe('MPL query URL behavior', () => {
  it('requires edge routing for metrics queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token' });

    await expect(
      client.query('metrics:http_requests_total', {
        type: 'mpl',
        startTime: 'now-1h',
        endTime: 'now',
      }),
    ).rejects.toThrow('MPL queries must be routed to an Axiom edge deployment');
  });

  it('does not route metrics queries through the configured API URL', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

    await expect(
      client.query('metrics:http_requests_total', {
        type: 'mpl',
        startTime: 'now-1h',
        endTime: 'now',
      }),
    ).rejects.toThrow('MPL queries must be routed to an Axiom edge deployment');
  });

  it('posts metrics queries to edge _mpl with body, format, and Accept override', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token' });

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${edgeUrl}/v1/query/_mpl?format=metrics-v2`);
      expect(init.method).toEqual('POST');
      expect(init.headers).toMatchObject({
        Accept: 'application/json+metrics.v2',
      });
      expect(init.body).toEqual(
        JSON.stringify({
          mpl: 'metrics:http_requests_total',
          startTime: 'now-1h',
          endTime: 'now',
        }),
      );
    }, metricsResult);

    await client.query('metrics:http_requests_total', {
      type: 'mpl',
      startTime: 'now-1h',
      endTime: 'now',
      edgeUrl,
      format: 'metrics-v2',
      accept: 'application/json+metrics.v2',
    });
  });

  it.each([
    ['cloud.us-east-1.aws', 'https://us-east-1.aws.edge.axiom.co/v1/query/_mpl'],
    ['cloud.eu-central-1.aws', 'https://eu-central-1.aws.edge.axiom.co/v1/query/_mpl'],
  ])('routes documented edgeDeployment ID %s to its edge query domain', async (edgeDeployment, expectedUrl) => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(expectedUrl);
      expect(init.body).toEqual(
        JSON.stringify({
          mpl: 'metrics:http_requests_total',
          startTime: 'now-1h',
          endTime: 'now',
        }),
      );
    }, metricsResult);

    await client.query('metrics:http_requests_total', {
      type: 'mpl',
      startTime: 'now-1h',
      endTime: 'now',
      edgeDeployment,
    });
  });

  it('rejects undocumented edgeDeployment IDs', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

    await expect(
      client.query('metrics:http_requests_total', {
        type: 'mpl',
        startTime: 'now-1h',
        endTime: 'now',
        edgeDeployment: 'cloud.ap-south-1.aws',
      }),
    ).rejects.toThrow('Unsupported edgeDeployment "cloud.ap-south-1.aws"');
  });

  it.each([
    [
      'edgeUrl',
      { edgeUrl: 'https://us-east-1.aws.edge.axiom.co' },
      'https://us-east-1.aws.edge.axiom.co/v1/query/_mpl',
    ],
    ['edge', { edge: 'us-east-1.aws.edge.axiom.co' }, 'https://us-east-1.aws.edge.axiom.co/v1/query/_mpl'],
  ])('uses per-call %s before constructor MPL routing', async (_name, routing, expectedUrl) => {
    const client = new AxiomWithoutBatching({
      token: 'test-token',
      url: customApiUrl,
      edge: edgeDomain,
      edgeUrl,
    });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(expectedUrl);
    }, metricsResult);

    await client.query('metrics:http_requests_total', {
      type: 'mpl',
      startTime: 'now-1h',
      endTime: 'now',
      ...routing,
    });
  });

  it.each([
    [
      'edgeUrl',
      { edgeUrl: 'https://us-east-1.aws.edge.axiom.co' },
      'https://us-east-1.aws.edge.axiom.co/v1/query/_mpl',
    ],
    ['edge', { edge: 'us-east-1.aws.edge.axiom.co' }, 'https://us-east-1.aws.edge.axiom.co/v1/query/_mpl'],
  ])(
    'uses constructor %s for MPL routing when per-call routing is absent',
    async (_name, clientRouting, expectedUrl) => {
      const client = new AxiomWithoutBatching({
        token: 'test-token',
        url: customApiUrl,
        ...clientRouting,
      });

      testMockedFetchCall((url: string) => {
        expect(url).toEqual(expectedUrl);
      }, metricsResult);

      await client.query('metrics:http_requests_total', {
        type: 'mpl',
        startTime: 'now-1h',
        endTime: 'now',
      });
    },
  );

  it('keeps custom edgeUrl paths as-is for MPL queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edgeUrl: `${customQueryPath}/` });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(customQueryPath);
    }, metricsResult);

    await client.query('metrics:http_requests_total', {
      type: 'mpl',
      startTime: 'now-1h',
      endTime: 'now',
    });
  });

  it('keeps query callable when detached from the client instance', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edge: 'us-east-1.aws.edge.axiom.co' });
    const query = client.query;

    testMockedFetchCall((url: string) => {
      expect(url).toEqual('https://us-east-1.aws.edge.axiom.co/v1/query/_mpl');
    }, metricsResult);

    await query('metrics:http_requests_total', {
      type: 'mpl',
      startTime: 'now-1h',
      endTime: 'now',
    });
  });
});
