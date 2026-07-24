import { Axiom } from '@axiomhq/js';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const axiom = new Axiom({
    token: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
    url: process.env.NEXT_PUBLIC_AXIOM_URL,
    orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
  });

  axiom.ingest(`axiom-js-e2e-test-${process.env.AXIOM_DATASET_SUFFIX || 'local'}`, [
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
