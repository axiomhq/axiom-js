import { AxiomClient } from '@axiomhq/js';

const axiomClient = new AxiomClient({
  autoFlush: true,
  token: process.env.AXIOM_TOKEN || '',
  dataset: process.env.AXIOM_DATASET || '',
  orgId: process.env.AXIOM_ORGID || '',
});

axiomClient.info('Hello from axiom client');
axiomClient.flushLogger();

async function ingest() {
  const events = [
    {
      foo: 'bar',
    },
    {
      x: 'y',
    },
  ];

 await axiomClient.ingest('my-dataset', events);
}
ingest();
