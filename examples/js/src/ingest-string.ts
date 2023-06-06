import { Client, ContentType, ContentEncoding } from '@axiomhq/js';

const client = new Client();

async function ingestString() {
  const data = JSON.stringify([{ foo: 'bar' }, { foo: 'bar' }, { bar: 'baz' }]);
  const res = await client.ingestRaw('my-dataset', data, ContentType.JSON, ContentEncoding.Identity);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 3 events with 0 failures
}

ingestString();
