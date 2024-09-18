// The purpose of this example is to show how to query a dataset using the Axiom
// Processing Language (APL).
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL || '' });

async function query() {
  const aplQuery = "['new-lambda-test']";

  const res = await axiom.query(aplQuery, {
    startTime: '2023-10-23T15:46:25.089482+02:00',
    format: 'tabular',
  });

  if (!res.tables || res.tables.length === 0) {
    console.warn('no tables found');
    return;
  }

  for (let table of res.tables) {
    console.table(table);
  }
}

query();
