import { describe, expect, it, vi } from 'vitest';
import { datasets } from '../../src/datasets';
import { testMockedFetchCall } from '../lib/mock';

const baseUrl = 'http://axiom-js.dev.local';
const edgeUrl = 'https://us-east-1.aws.edge.axiom.co';
const metricsWindow = { start: '2026-06-02T10:31:37-04:00', end: '2026-06-03T10:31:37-04:00' };
const metricsQuery = new URLSearchParams(metricsWindow).toString();

const mockNoContentFetchCall = (test: (url: string, init: RequestInit) => void) => {
  vi.spyOn(global, 'fetch').mockImplementationOnce((url: RequestInfo | URL, init?: RequestInit) => {
    test(String(url), init ?? {});
    return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content' }));
  });
};

const datasetList = [
  {
    id: 'test',
    name: 'test',
    description: 'Test dataset',
    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
    created: '2020-11-17T22:29:00.521238198Z',
    edgeDeployment: 'cloud.us-east-1.aws',
    kind: 'axiom:events:v1',
    mapFields: null,
  },
  {
    id: 'test1',
    name: 'test1',
    description: 'This is a test description',
    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
    created: '2020-11-17T22:29:00.521238198Z',
    edgeDeployment: null,
    kind: 'otel:metrics:v1',
    mapFields: ['tags'],
  },
];

describe('DatasetsService', () => {
  const client = new datasets.Service({ url: baseUrl, token: 'test-token' });

  it('List', async () => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/datasets`);
      expect(init.method).toEqual('GET');
    }, datasetList);

    const response = await client.list();
    expect(response).not.toEqual('undefined');
    expect(response).toHaveLength(2);
  });

  it.each([
    {
      name: 'regular dataset',
      dataset: { ...datasetList[0], id: 'events/name', name: 'events/name' },
      expectedMapFields: null,
      expectedKind: 'axiom:events:v1',
    },
    {
      name: 'metrics dataset',
      dataset: { ...datasetList[1], id: 'metrics/name', name: 'metrics/name' },
      expectedMapFields: ['tags'],
      expectedKind: 'otel:metrics:v1',
    },
  ])('Get returns the v2 resource for a $name', async ({ dataset, expectedKind, expectedMapFields }) => {
    const encodedId = encodeURIComponent(dataset.id);

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/datasets/${encodedId}`);
      expect(init.method).toEqual('GET');
    }, dataset);

    const response = await client.get(dataset.id);
    expect(response).toBeDefined();
    expect(response.id).toEqual(dataset.id);
    expect(response.edgeDeployment).toEqual(dataset.edgeDeployment);
    expect(response.kind).toEqual(expectedKind);
    expect(response.mapFields).toEqual(expectedMapFields);
  });

  it('Create', async () => {
    const request: datasets.CreateRequest = {
      name: 'test1',
      description: 'This is a test description',
      kind: 'axiom:events:v1',
      retentionDays: 30,
      useRetentionPeriod: true,
    };

    testMockedFetchCall(
      (url: string, init: RequestInit) => {
        expect(url).toEqual(`${baseUrl}/v2/datasets?referrer=symphony`);
        expect(init.method).toEqual('POST');
        expect(init.body).toEqual(JSON.stringify(request));
      },
      { id: request.name, description: request.description },
    );

    const response = await client.create(request, { referrer: 'symphony' });
    expect(response).toBeDefined();
    expect(response.id).toEqual('test1');
    expect(response.description).toEqual('This is a test description');
  });

  it('Create without referrer does not send an empty query param', async () => {
    const request: datasets.CreateRequest = {
      name: 'test1',
    };

    testMockedFetchCall(
      (url: string, init: RequestInit) => {
        expect(url).toEqual(`${baseUrl}/v2/datasets`);
        expect(init.method).toEqual('POST');
        expect(init.body).toEqual(JSON.stringify(request));
      },
      { id: request.name, description: '' },
    );

    const response = await client.create(request);
    expect(response.id).toEqual('test1');
  });

  it('Update', async () => {
    const req: datasets.UpdateRequest = {
      description: 'This is a test description',
      retentionDays: 30,
      useRetentionPeriod: true,
    };

    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/datasets/test%2F1`);
      expect(init.method).toEqual('PUT');
      expect(init.body).toEqual(JSON.stringify(req));
    }, datasetList[1]);

    const response = await client.update('test/1', req);
    expect(response).not.toEqual('undefined');
    expect(response.id).toEqual('test1');
    expect(response.description).toEqual('This is a test description');
  });

  it('Delete', async () => {
    mockNoContentFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/datasets/test%2F1`);
      expect(init.method).toEqual('DELETE');
    });

    const response = await client.delete('test/1');
    expect(response).toBeDefined();
    expect(response.status).toEqual(204);
  });

  it('Trim', async () => {
    mockNoContentFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${baseUrl}/v2/datasets/test%2F1/trim`);
      expect(init.method).toEqual('POST');
      expect(init.body).toEqual(JSON.stringify({ maxDuration: '30m' }));
    });

    const response = await client.trim('test/1', '30m');
    expect(response).not.toEqual('undefined');
    expect(response.status).toEqual(204);
  });

  it.each([
    {
      name: 'fields',
      call: (service: datasets.Service) => service.fields('dataset/name'),
      expectedMethod: 'GET',
      expectedPath: '/v2/datasets/dataset%2Fname/fields',
      response: [{ name: 'field/name', type: 'string' }],
    },
    {
      name: 'mapFields',
      call: (service: datasets.Service) => service.mapFields('dataset/name'),
      expectedMethod: 'GET',
      expectedPath: '/v2/datasets/dataset%2Fname/mapfields',
      response: ['map/field'],
    },
  ])(
    '$name uses the expected dataset metadata endpoint',
    async ({ call, expectedBody, expectedMethod, expectedPath, response }) => {
      testMockedFetchCall((url: string, init: RequestInit) => {
        expect(url).toEqual(`${baseUrl}${expectedPath}`);
        expect(init.method).toEqual(expectedMethod);
        if (expectedBody) {
          expect(init.body).toEqual(JSON.stringify(expectedBody));
        } else {
          expect(init.body).toBeUndefined();
        }
      }, response);

      await call(client);
    },
  );

  it.each([
    {
      name: 'metrics',
      call: (service: datasets.Service) => service.metrics('metrics/dataset', { ...metricsWindow, edgeUrl }),
      expectedPath: '/v1/query/metrics/info/datasets/metrics%2Fdataset/metrics',
      response: {
        'http.requests': {
          temporality: 'Delta',
          type: 'Counter',
          unit: null,
        },
      },
    },
    {
      name: 'metricTags',
      call: (service: datasets.Service) =>
        service.metricTags('metrics/dataset', 'http/requests total', { ...metricsWindow, edgeUrl }),
      expectedPath: '/v1/query/metrics/info/datasets/metrics%2Fdataset/metrics/http%2Frequests%20total/tags',
      response: ['service/name'],
    },
    {
      name: 'metricTagValues',
      call: (service: datasets.Service) =>
        service.metricTagValues('metrics/dataset', 'http/requests total', 'service/name', {
          ...metricsWindow,
          edgeUrl,
        }),
      expectedPath:
        '/v1/query/metrics/info/datasets/metrics%2Fdataset/metrics/http%2Frequests%20total/tags/service%2Fname/values',
      response: ['api'],
    },
    {
      name: 'metricDatasetTags',
      call: (service: datasets.Service) => service.metricDatasetTags('metrics/dataset', { ...metricsWindow, edgeUrl }),
      expectedPath: '/v1/query/metrics/info/datasets/metrics%2Fdataset/tags',
      response: ['service/name'],
    },
    {
      name: 'metricDatasetTagValues',
      call: (service: datasets.Service) =>
        service.metricDatasetTagValues('metrics/dataset', 'service/name', { ...metricsWindow, edgeUrl }),
      expectedPath: '/v1/query/metrics/info/datasets/metrics%2Fdataset/tags/service%2Fname/values',
      response: ['api'],
    },
  ])('$name uses the expected metrics metadata endpoint', async ({ call, expectedPath, response }) => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${edgeUrl}${expectedPath}?${metricsQuery}`);
      expect(init.method).toEqual('GET');
      expect(init.body).toBeUndefined();
    }, response);

    await call(client);
  });

  it('routes metrics metadata by edgeDeployment and sends an Accept override', async () => {
    testMockedFetchCall((url: string, init: RequestInit) => {
      expect(url).toEqual(`${edgeUrl}/v1/query/metrics/info/datasets/metrics/metrics?${metricsQuery}`);
      expect(init.headers).toMatchObject({
        Accept: 'application/vnd.metrics-info.v2+json',
      });
    }, {});

    await client.metrics('metrics', {
      ...metricsWindow,
      accept: 'application/vnd.metrics-info.v2+json',
      edgeDeployment: 'cloud.us-east-1.aws',
    });
  });

  it('requires edge routing for metrics metadata', async () => {
    await expect(client.metrics('metrics', metricsWindow)).rejects.toThrow(
      'metrics metadata requests must be routed to an Axiom edge deployment',
    );
  });
});
