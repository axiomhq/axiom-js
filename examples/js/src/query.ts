// The purpose of this example is to show how to query a dataset using the Axiom
// Processing Language (APL).
import { Client } from '@axiomhq/js';

const client = new Client();

async function query() {
  const aplQuery = "['my-dataset']";

  const res = await client.query(aplQuery);
  if (!res.matches || res.matches.length === 0) {
    console.warn('no matches found');
    return;
  }

  for (let matched of res.matches) {
    console.log(matched.data);
  }
}

query();
