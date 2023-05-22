import { Client, ContentEncoding, ContentType } from '@axiomhq/js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const client = new Client();

  const resp = await client.ingest(
    'axiom-js-e2e-test',
    `[{"foo":"bar", "test": "ingest_on_lambda"},{"bar":"baz", "test": "ingest_on_lambda"}]`,
    ContentType.JSON,
    ContentEncoding.Identity,
  );
  if (resp.ingested !== 2) {
    return NextResponse.json({ test: 'ingest_on_lambda', error: 'ingest failed' }, { status: 500 });
  }

  return NextResponse.json({ test: 'ingest_on_lambda', ...resp });
}
