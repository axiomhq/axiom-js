import { describe, expect, it } from 'vitest';
import { datasets } from '../../src/datasets';
import { mockFetchResponse, mockNoContentResponse } from '../lib/mock';

const datasetList = [
  {
    id: 'test',
    name: 'test',
    description: 'Test dataset',
    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
    created: '2020-11-17T22:29:00.521238198Z',
  },
  {
    id: 'test1',
    name: 'test1',
    description: 'This is a test description',
    who: 'f83e245a-afdc-47ad-a765-4addd1994333',
    created: '2020-11-17T22:29:00.521238198Z',
  },
];

describe('DatasetsService', () => {
  const client = new datasets.Service({ url: 'http://axiom-js.dev.local' });

  it('List', async () => {
    mockFetchResponse(datasetList);
    const response = await client.list();
    expect(response).not.toEqual('undefined');
    expect(response).toHaveLength(2);
  });

  it('Get', async () => {
    mockFetchResponse(datasetList[0]);
    const response = await client.get('test');
    expect(response).toBeDefined();
    expect(response.id).toEqual('test');
    expect(response.description).toEqual('Test dataset');
  });

  it('Create', async () => {
    const request: datasets.CreateRequest = {
      name: 'test1',
      description: 'This is a test description',
    };

    mockFetchResponse({ id: request.name, description: request.description });

    const response = await client.create(request);
    expect(response).toBeDefined();
    expect(response.id).toEqual('test1');
    expect(response.description).toEqual('This is a test description');
  });

  it('Update', async () => {
    const req: datasets.UpdateRequest = {
      description: 'This is a test description',
    };

    mockFetchResponse(datasetList[1]);

    const response = await client.update('test1', req);
    expect(response).not.toEqual('undefined');
    expect(response.id).toEqual('test1');
    expect(response.description).toEqual('This is a test description');
  });

  it('Delete', async () => {
    mockNoContentResponse();

    const response = await client.delete('test1');
    expect(response).toBeDefined();
    expect(response.status).toEqual(204);
  });

  it('Trim', async () => {
    mockFetchResponse({ ok: true });
    const response = await client.trim('test1', '30m');
    expect(response).not.toEqual('undefined');
  });
});
