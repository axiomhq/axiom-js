import { jest } from '@jest/globals';

export const mockFetchResponse = (body: any, statusCode: number = 200, headers = {}) => {
  const resp = new Response(JSON.stringify(body), { status: statusCode, headers });
  const func: () => Promise<Response> = () => {
    return Promise.resolve(resp);
  };

  jest.spyOn(global, 'fetch').mockImplementationOnce(func);
};

export const testMockedFetchCall = (test: any, body: any, statusCode: number = 200, headers = {}) => {
  const func: typeof fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    test(url, init);
    return Promise.resolve(new Response(JSON.stringify(body), { status: statusCode, headers }));
  };

  jest.spyOn(global, 'fetch').mockImplementationOnce(func);
};

export const mockNoContentResponse = () => {
  jest.spyOn(global, 'fetch').mockImplementationOnce(() => {
    return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content' }));
  });
};
