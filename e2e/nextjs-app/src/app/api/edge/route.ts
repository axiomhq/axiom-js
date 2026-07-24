import { AxiomWithoutBatching } from '@axiomhq/js';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // disable prerendering

export async function GET(request: Request) {
  const dataset = new URL(request.url).searchParams.get('dataset') || 'axiom-js-e2e-test';
  const axiom = new AxiomWithoutBatching({
    token: process.env.AXIOM_TOKEN || '',
    orgId: process.env.AXIOM_ORG_ID,
    url: process.env.AXIOM_URL,
  });

  const resp = await axiom.ingest(dataset, [
    { foo: 'bar', test: 'ingest_on_edge', request: { path: '/api/edge' } },
    { bar: 'baz', test: 'ingest_on_edge', request: { path: '/api/edge' } },
  ]);

  if (resp.ingested !== 2) {
    return NextResponse.json({ test: 'ingest_on_edge', error: 'ingest failed' }, { status: 500 });
  }

  return NextResponse.json({ test: 'ingest_on_edge', ...resp });
}
