import { Axiom } from '@axiomhq/js';

const axiom = new Axiom();

async function listDatasets() {
  const res = await axiom.datasets.list();
  for (let ds of res) {
    console.log(`found dataset: ${ds.name}`);
  }
}

listDatasets();
