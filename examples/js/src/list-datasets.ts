import { AxiomClient } from '@axiomhq/js';

const axiom = new AxiomClient({ token: process.env.AXIOM_TOKEN || '' });

async function listDatasets() {
  const res = await axiom.datasets.list();
  for (const ds of res) {
    console.log(`found dataset: ${ds.name}`);
  }
}

listDatasets();
