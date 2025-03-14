import { withAxiom } from '@/lib/axiom/server';

export const runtime = 'edge';

export const GET = withAxiom(async () => {
  return new Response('Hello World!');
});
