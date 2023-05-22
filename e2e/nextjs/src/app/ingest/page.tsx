'use client';
import { Client, ContentEncoding, ContentType } from '@axiomhq/js';

export const dynamic = 'force-dynamic';

export default async function IngestPage() {
  try {
    const client = new Client();

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
    console.error(err);
    return <div>failed to ingest, check console for errors</div>;
  }
}
