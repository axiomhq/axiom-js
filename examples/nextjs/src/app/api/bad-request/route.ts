import { withAxiom } from '@/lib/axiom/server';

export const GET = withAxiom(async () => {
  return new Response('Bad Request', { status: 400 });
});
