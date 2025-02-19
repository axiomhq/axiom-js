import { NextRequest } from 'next/server';

export const transformMiddlewareRequest = (
  request: NextRequest | Request,
): [message: string, report: Record<string, any>] => {
  const url = 'nextUrl' in request ? request.nextUrl : new URL(request.url);

  const report = {
    request: {
      ip: 'ip' in request ? request.ip : undefined,
      region: 'geo' in request ? (request.geo as { region?: string }).region : undefined,
      method: request.method,
      host: url.hostname,
      path: url.pathname,
      scheme: url.protocol.split(':')[0],
      referer: request.headers.get('Referer'),
      userAgent: request.headers.get('user-agent'),
    },
  };

  return [`${request.method} ${url.pathname}`, report];
};
