import { AxiomWithoutBatching } from '@axiomhq/js';

const axiom = new AxiomWithoutBatching({ token: process.env.AXIOM_TOKEN || ''});

async function ingest() {
  const events = [
    {
      foo: 'bar',
    },
    {
      x: 'y',
    },
  ];

  const res = await axiom.ingest('my-dataset', events);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 2 events with 0 failures
}

ingest();
