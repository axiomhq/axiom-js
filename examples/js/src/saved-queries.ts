import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
  url: process.env.AXIOM_URL || '',
});

async function inspectSavedQueries() {
  const queries = await axiom.savedQueries.list({
    limit: Number(process.env.AXIOM_SAVED_QUERY_LIMIT || 10),
    who: process.env.AXIOM_SAVED_QUERY_WHO || 'all',
  });

  console.log(`saved queries: ${queries.length}`);
  for (const query of queries.slice(0, 10)) {
    console.log(`- ${query.name} (${query.id})`);
  }

  const first = queries[0];
  if (!first) {
    return;
  }

  const savedQuery = await axiom.savedQueries.get(first.id);
  console.log(`\nfirst query: ${savedQuery.name}`);
  console.log(savedQuery.query.apl);
}

inspectSavedQueries().catch(console.error);
