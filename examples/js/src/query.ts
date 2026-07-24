// The purpose of this example is to show how to query a dataset using the Axiom
// Processing Language (APL).
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL || '' });

async function query() {
  const aplQuery = `
    ['my-dataset']
    | where foo == "bar"
    | summarize cost = sum(value) by group_field
  `;

  const res = await axiom.query(aplQuery, {
    startTime: '2026-06-02T10:31:37-04:00',
    endTime: '2026-06-03T10:31:37-04:00',
    format: 'tabular',
  });

  if (!res.tables || res.tables.length === 0) {
    console.warn('no tables found');
    return;
  }

  for (const table of res.tables) {
    console.table(table);
  }
}

query().catch(console.error);
