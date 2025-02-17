import { LogEvent, Logger } from '@axiomhq/logging';

export const createProxyRouteHandler = (logger: Logger) => {
  return async <T extends Request>(req: T) => {
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
