import { withAxiom } from '@/lib/axiom/server';

export const GET = withAxiom(async () => {
  throw new Error('Test error');
});
