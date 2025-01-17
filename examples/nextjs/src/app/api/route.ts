import { logger } from '@/lib/axiom/server';
import {
  createAxiomRouteHandler,
  logErrorByStatusCode,
  transformErrorResult,
  transformSuccessResult,
} from '@axiomhq/nextjs';

const axiomRouteHandler = createAxiomRouteHandler(logger);

export const GET = axiomRouteHandler(async () => {
  return new Response('Hello World!');
});

export const POST = axiomRouteHandler(
  async (req) => {
    return new Response(JSON.stringify(req.body));
  },
  async (result) => {
    if (result.ok) {
      logger.info(...transformSuccessResult(result.data));
      logger.info('searchParams', result.data.req.nextUrl.searchParams);
    } else {
      if (result.data.error instanceof Error) {
        logger.error(result.data.error.message, result.data.error);
      }

      const [message, report] = transformErrorResult(result.data);
      logger[logErrorByStatusCode(report.statusCode)](message, report);
    }
  },
);
