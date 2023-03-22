import Client from '@axiomhq/axiom-js';

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

  const res = await client.ingestEvents('my-dataset', events);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 2 events with 0 failures
}

ingest();
