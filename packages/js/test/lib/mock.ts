import { vi } from "vitest";

export const mockFetchResponse = (body: any, statusCode: number = 200, headers = {}) => {
  const resp = new Response(JSON.stringify(body), { status: statusCode, headers });
  const func: () => Promise<Response> = () => {
    return Promise.resolve(resp);
  };

  vi.spyOn(global, "fetch").mockImplementationOnce(func);
};

export const mockFetchResponseErr = (statusCode = 500, headers = {}) => {
  const resp = new Response(null, { status: statusCode, headers });
  const func: () => Promise<Response> = () => {
    return Promise.reject(resp);
  };

  vi.spyOn(global, "fetch").mockImplementationOnce(func);
};

export const testMockedFetchCall = (test: any, body: any, statusCode: number = 200, headers = {}) => {
  const func: typeof fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    test(url, init);
    return Promise.resolve(new Response(JSON.stringify(body), { status: statusCode, headers }));
  };

  vi.spyOn(global, "fetch").mockImplementationOnce(func);
};

export const mockNoContentResponse = () => {
  vi.spyOn(global, "fetch").mockImplementationOnce(() => {
    return Promise.resolve(new Response(null, { status: 204, statusText: "No Content" }));
  });
};
