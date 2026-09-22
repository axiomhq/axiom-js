import { AxiomClient } from '@axiomhq/js';

const axiomClient = new AxiomClient({
  token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
});

export default axiomClient;
