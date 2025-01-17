import { NextRequest } from 'next/server';

export const transformMiddlewareRequest = (
  request: NextRequest & { geo?: { region: string }; ip?: string },
): [message: string, report: Record<string, any>] => {
  const report = {
    request: {
      ip: request.ip,
      region: request.geo?.region,
      method: request.method,
      host: request.nextUrl.hostname,
      path: request.nextUrl.pathname,
      scheme: request.nextUrl.protocol.split(':')[0],
      referer: request.headers.get('Referer'),
      userAgent: request.headers.get('user-agent'),
    },
  };

  return [`${request.method} ${request.nextUrl.pathname}`, report];
};
