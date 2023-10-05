import { Axiom, ContentType, ContentEncoding } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || ''});

async function ingestString() {
  const data = JSON.stringify([{ foo: 'bar' }, { foo: 'bar' }, { bar: 'baz' }]);
  const res = await axiom.ingestRaw('my-dataset', data, ContentType.JSON, ContentEncoding.Identity);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 3 events with 0 failures
}

ingestString();
