import { logger, withAxiom } from '@/lib/axiom/server';

export const GET = withAxiom(async () => {
  logger.info('Hello World!');
  return new Response('Hello World!');
});

export const POST = withAxiom(async (req) => {
  logger.info('Hello World!');
  return new Response(JSON.stringify(req.body));
});
