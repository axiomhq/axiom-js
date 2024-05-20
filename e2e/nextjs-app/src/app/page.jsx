import { Axiom } from '@axiomhq/js';

export default async function Home() {
  const axiom = new Axiom({
    token: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
    url: process.env.NEXT_PUBLIC_AXIOM_URL,
    orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
  });

  axiom.ingest('axiom-js-e2e-test', [
    {
      name: 'test',
      request: {
        path: '/'
      }
    },
  ]);

  await axiom.flush();

  return <div>This in RSC component that ingests into Axiom</div>;
}
