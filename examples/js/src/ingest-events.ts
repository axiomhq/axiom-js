import { ClientWithoutBatching } from '@axiomhq/js';

const client = new ClientWithoutBatching();

async function ingest() {
  const events = [
    {
      foo: 'bar',
    },
    {
      x: 'y',
    },
  ];

  const res = await client.ingest('my-dataset', events);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 2 events with 0 failures
}

ingest();
