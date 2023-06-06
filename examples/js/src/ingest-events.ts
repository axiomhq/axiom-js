import { Client } from '@axiomhq/js';

const client = new Client();

async function ingest() {
  const events = [
    {
      foo: 'bar',
    },
    {
      x: 'y',
    },
  ];

  const res = client.ingest('my-dataset', events);
  await client.flush();
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 2 events with 0 failures
}

ingest();
