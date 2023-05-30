'use client';
import { Client, ContentEncoding, ContentType } from '@axiomhq/js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function IngestPage() {
  try {
    const client = new Client({
      token: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
      orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
      url: process.env.NEXT_PUBLIC_AXIOM_URL,
    });

    const resp = await client.ingest(
      'axiom-js-e2e-test',
      `[{"foo":"bar", "test": "ingest_on_browser"},{"bar":"baz", "test": "ingest_on_browser"}]`,
      ContentType.JSON,
      ContentEncoding.Identity,
    );

    return (
      <div>
        <p>{process.env.AXIOM_TOKEN}, {process.env.AXIOM_ORG_ID}, {process.env.AXIOM_URL}</p>
        <p>debug values: {process.env.NEXT_PUBLIC_AXIOM_TOKEN}, {process.env.NEXT_PUBLIC_AXIOM_ORG_ID}, {process.env.NEXT_PUBLIC_AXIOM_URL}</p>
        <p>ingested: {resp.ingested}, failed: {resp.failed}</p>
      </div>
    );
  } catch (err: any) {
    return <div>
      <p>{process.env.AXIOM_TOKEN}, {process.env.AXIOM_ORG_ID}, {process.env.AXIOM_URL}</p>
        <p>debug values: {process.env.NEXT_PUBLIC_AXIOM_TOKEN}, {process.env.NEXT_PUBLIC_AXIOM_ORG_ID}, {process.env.NEXT_PUBLIC_AXIOM_URL}</p>
      <p>failed to ingest, check console for errors</p>
    </div>;
  }
}
