import { describe, expect, it, beforeEach } from 'vitest';

import { ContentType, ContentEncoding, Axiom, AxiomWithoutBatching } from '../../src/client';
import { AxiomTooManyRequestsError } from '../../src/fetchClient';
import { headerAPILimit, headerAPIRateRemaining, headerAPIRateReset, headerRateScope } from '../../src/limit';
import { mockFetchResponse, mockFetchResponseErr, testMockedFetchCall } from '../lib/mock';

const queryLegacyResult = {
  status: {
    elapsedTime: 542114,
    blocksExamined: 4,
    rowsExamined: 142655,
    rowsMatched: 142655,
    numGroups: 0,
    isPartial: false,
    cacheStatus: 1,
    minBlockTime: '2020-11-19T11:06:31.569475746Z',
    maxBlockTime: '2020-11-27T12:06:38.966791794Z',
  },
  matches: [
    {
      _time: '2020-11-19T11:06:31.569475746Z',
      _sysTime: '2020-11-19T11:06:31.581384524Z',
      _rowId: 'c776x1uafkpu-4918f6cb9000095-0',
      data: {
        agent: 'Debian APT-HTTP/1.3 (0.8.16~exp12ubuntu10.21)',
        bytes: 0,
        referrer: '-',
        remote_ip: '93.180.71.3',
        remote_user: '-',
        request: 'GET /downloads/product_1 HTTP/1.1',
        response: 304,
        time: '17/May/2015:08:05:32 +0000',
      },
    },
    {
      _time: '2020-11-19T11:06:31.569479846Z',
      _sysTime: '2020-11-19T11:06:31.581384524Z',
      _rowId: 'c776x1uafnvq-4918f6cb9000095-1',
      data: {
        agent: 'Debian APT-HTTP/1.3 (0.8.16~exp12ubuntu10.21)',
        bytes: 0,
        referrer: '-',
        remote_ip: '93.180.71.3',
        remote_user: '-',
        request: 'GET /downloads/product_1 HTTP/1.1',
        response: 304,
        time: '17/May/2015:08:05:23 +0000',
      },
    },
  ],
  buckets: {
    series: [],
    totals: [],
  },
};

const queryResult = {
  request: {
    startTime: '2020-11-19T11:06:31.569475746Z',
    endTime: '2020-11-27T12:06:38.966791794Z',
    resolution: 'auto',
  },
  ...queryLegacyResult,
};

const clientURL = 'http://axiom-js-retries.dev.local';

describe('Axiom', () => {
  let axiom = new AxiomWithoutBatching({ url: clientURL, token: '' });
  expect(axiom).toBeDefined();

  beforeEach(() => {
    // reset client to clear rate limits
    axiom = new AxiomWithoutBatching({ url: clientURL, token: '' });
  });

  it('Services', () => {
    expect(axiom.datasets).toBeTruthy();
    expect(axiom.users).toBeTruthy();
  });

  it('Retries failed 5xx requests', async () => {
    // TODO: this doesn't actually check that retries happened, fix
    mockFetchResponse({}, 500);
    mockFetchResponse({}, 500);
    mockFetchResponse([{ name: 'test' }], 200);

    const resp = await axiom.datasets.list();
    // expect(fetch).toHaveBeenCalledTimes(3);
    expect(resp.length).toEqual(1);
  });

  it('Does not retry failed requests < 500', async () => {
    // TODO: this doesn't actually check that retries happend or not, fix
    mockFetchResponse({}, 401);
    // global.fetch = mockFetchResponse([{ name: 'test' }], 200);

    expect(axiom.datasets.list).rejects.toThrow(new Error('Forbidden'));

    // create another request to ensure that
    // the fetch mock was not consumed before
    // const resp = await axiom.datasets.list();
    // expect(fetch).toHaveBeenCalledTimes(2);
    // expect(resp.length).toEqual(1);
  });

  it('No shortcircuit for ingest or query when there is api rate limit', async () => {
    const resetTimeInSeconds = Math.floor(new Date().getTime() / 1000) + 1;
    const headers: HeadersInit = {};
    headers[headerRateScope] = 'anonymous';
    headers[headerAPILimit] = '1000';
    headers[headerAPIRateRemaining] = '0';
    headers[headerAPIRateReset] = resetTimeInSeconds.toString();

    mockFetchResponse({}, 429, headers);
    expect(axiom.datasets.list).rejects.toBeInstanceOf(AxiomTooManyRequestsError);

    // ingest and query should succeed
    mockFetchResponse({}, 200, headers);
    await axiom.ingest('test', [{ name: 'test' }]);

    mockFetchResponse({}, 200, headers);
    await axiom.query("['test']");
  });

  it('IngestString', async () => {
    const query = [{ foo: 'bar' }, { foo: 'baz' }];

    const ingestStatus = {
      ingested: 2,
      failed: 0,
      failures: [],
      processedBytes: 630,
      blocksCreated: 0,
      walLength: 2,
    };
    testMockedFetchCall((_: string, init: RequestInit) => {
      expect(init.headers).toHaveProperty('Content-Type');
      expect(init.body).toMatch(JSON.stringify(query));
    }, ingestStatus);

    const response = await axiom.ingestRaw('test', JSON.stringify(query), ContentType.JSON, ContentEncoding.Identity);
    expect(response).toBeDefined();
    expect(response.ingested).toEqual(2);
    expect(response.failed).toEqual(0);
  });

  it('Query', async () => {
    mockFetchResponse(queryLegacyResult);

    // works without options
    let query = {
      startTime: '2020-11-26T11:18:00Z',
      endTime: '2020-11-17T11:18:00Z',
      resolution: 'auto',
    };
    let response = await axiom.queryLegacy('test', query);
    expect(response).toBeDefined();
    expect(response.matches).toHaveLength(2);

    // works with options
    query = {
      startTime: '2020-11-26T11:18:00Z',
      endTime: '2020-11-17T11:18:00Z',
      resolution: 'auto',
    };
    const options = {
      streamingDuration: '1m',
      noCache: true,
    };

    mockFetchResponse(queryLegacyResult);
    response = await axiom.queryLegacy('test', query, options);
    expect(response).toBeDefined();
    expect(response.matches).toHaveLength(2);
  });

  it('APL Query', async () => {
    mockFetchResponse(queryResult);
    // works without options
    let response = await axiom.query("['test'] | where response == 304");
    expect(response).not.toEqual('undefined');
    expect(response.matches).toHaveLength(2);

    // works with options
    const options = {
      streamingDuration: '1m',
      noCache: true,
    };

    mockFetchResponse(queryResult);
    response = await axiom.query("['test'] | where response == 304", options);
    expect(response).not.toEqual('undefined');
    expect(response.matches).toHaveLength(2);
  });

  it('catch fetch errors correctly', async () => {
    let errorCaptured = false;
    let client = new Axiom({ url: clientURL, token: 'test', onError: (err) => {
      console.log('callback has been called', err);
      errorCaptured = true;
    } });
    mockFetchResponseErr();

    client.ingest('test', [{ name: 'test' }]);
    client.ingest('test', [{ name: 'test' }]);
    await client.flush();
    expect(true).toEqual(errorCaptured);
  }, 50000)
});
