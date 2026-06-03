import { describe, expect, it } from 'vitest';

import { AxiomWithoutBatching } from '../../src/client';
import { testMockedFetchCall } from '../lib/mock';

const defaultApiUrl = 'https://api.axiom.co';
const customApiUrl = 'http://axiom-js-query.dev.local';
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

describe('query URL behavior', () => {
  it('uses the configured url as the API base for APL queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${customApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('trims trailing slashes from the configured url before querying', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: `${customApiUrl}/` });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${customApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('does not use edge when no url is configured for APL queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edge: edgeDomain });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${defaultApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('does not use edgeUrl when no url is configured for APL queries', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', edgeUrl });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${defaultApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('uses url over edge and edgeUrl for APL queries today', async () => {
    const client = new AxiomWithoutBatching({
      token: 'test-token',
      url: customApiUrl,
      edge: edgeDomain,
      edgeUrl,
    });

    testMockedFetchCall((url: string) => {
      expect(url).toEqual(`${customApiUrl}/v1/datasets/_apl?format=legacy`);
    }, queryResult);

    await client.query("['test'] | count");
  });

  it('keeps query options in the URL search params', async () => {
    const client = new AxiomWithoutBatching({ token: 'test-token', url: customApiUrl });

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
});
