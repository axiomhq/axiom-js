import { LogEvent, Logger } from '@axiomhq/logger';
import { NextRequest } from 'next/server';

export const createProxyRouteHandler = (logger: Logger) => {
  return async (req: NextRequest) => {
    try {
      const events = (await req.json()) as LogEvent[];
      events.forEach((event) => {
        logger.raw(event);
      });
      await logger.flush();
      return new Response(JSON.stringify({ status: 'ok' }));
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
    }
  };
};
