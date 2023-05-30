'use client';
import { Client, ContentEncoding, ContentType } from '@axiomhq/js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function IngestPage() {
  try {
    const client = new Client({
      token: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
      orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
    });

    const resp = await client.ingest(
      'axiom-js-e2e-test',
      `[{"foo":"bar", "test": "ingest_on_browser"},{"bar":"baz", "test": "ingest_on_browser"}]`,
      ContentType.JSON,
      ContentEncoding.Identity,
    );

    return (
      <div>
        ingested: {resp.ingested}, failed: {resp.failed}
      </div>
    );
  } catch (err: any) {
    return <div>failed to ingest, check console for errors</div>;
  }
}
