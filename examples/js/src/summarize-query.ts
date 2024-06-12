import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', orgId: process.env.AXIOM_ORG_ID || '' });

async function query() {
  const aplQuery = `
    ['my-dataset']
    | where foo == "bar"
    and _time > datetime('2024-05-02')
    and _time < datetime('2024-05-27')
    | summarize cost = sum(value) by group_field
  `;

  try {
    const res = await axiom.query(aplQuery);
    console.log(JSON.stringify(res, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  }
}

query();
