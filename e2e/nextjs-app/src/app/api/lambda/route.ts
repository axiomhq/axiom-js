import { AxiomWithoutBatching } from '@axiomhq/js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // disable prerendering

export async function GET() {
  const axiom = new AxiomWithoutBatching({
    token: process.env.AXIOM_TOKEN || '',
    orgId: process.env.AXIOM_ORG_ID,
    url: process.env.AXIOM_URL,
  });

  try {
    const resp = await axiom.ingest(
      'axiom-js-e2e-test',
      [
        { foo: "bar", test: "ingest_on_lambda", request: { path: '/api/lambda' } },
        { bar: "baz", test: "ingest_on_lambda", request: { path: '/api/lambda' } }
      ],
    );

    if (resp.ingested !== 2) {
      return NextResponse.json({ test: 'ingest_on_lambda', error: 'ingest failed' }, { status: 500 });
    }

    return NextResponse.json({ test: 'ingest_on_lambda', ...resp });
  } catch (err) {
    return NextResponse.json({ test: 'ingest_on_lambda', error: err.message }, { status: 500 });
  }
}
