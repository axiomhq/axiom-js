'use client';
import { AxiomWithoutBatching, ContentEncoding, ContentType } from '@axiomhq/js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function IngestPage() {
  try {
    const axiom = new AxiomWithoutBatching({
      token: process.env.AXIOM_TOKEN,
      orgId: process.env.AXIOM_ORG_ID,
      url: process.env.AXIOM_URL,
    });

    const resp = await axiom.ingestRaw(
      'axiom-js-e2e-test',
      `[{"foo":"bar", "test": "ingest_on_browser"},{"bar":"baz", "test": "ingest_on_browser"}]`,
      ContentType.JSON,
      ContentEncoding.Identity,
    );

    return (
      <div>
        <p>
          ingested: {resp.ingested}, failed: {resp.failed}
        </p>
      </div>
    );
  } catch (err: any) {
    return (
      <div>
        <p>failed to ingest, check console for errors</p>
      </div>
    );
  }
}
