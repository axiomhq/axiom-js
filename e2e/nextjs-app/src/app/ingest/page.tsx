'use client';
import { AxiomWithoutBatching } from '@axiomhq/js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function IngestPage() {
  const axiom = new AxiomWithoutBatching({
    token: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
    orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
    url: process.env.NEXT_PUBLIC_AXIOM_URL,
  });

  axiom
    .ingest('axiom-js-e2e-test', [
      {
        foo: 'bar',
        test: 'ingest_on_browser',
        request: {
          path: '/ingest',
        },
      },
      {
        bar: 'baz',
        test: 'ingest_on_browser',
        request: {
          path: '/ingest',
        },
      },
    ])
    .then((r) => {
      console.log({ response: r });
    })
    .catch((err) => {
      console.error(err);
    });

  return (
    <div>
      <h1>Client component ingests to Axiom</h1>
      <p>check network tab for ingest status</p>
    </div>
  );
}
