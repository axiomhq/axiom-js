import { Client, ContentEncoding, ContentType } from '@axiomhq/js';

export default async function IngestPage() {
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
}
