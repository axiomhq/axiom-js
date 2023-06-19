// The purpose of this example is to show how to query a dataset using the Axiom
// Processing Language (APL).
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom();

async function query() {
  const aplQuery = "['my-dataset']";

  const res = await axiom.query(aplQuery);
  if (!res.matches || res.matches.length === 0) {
    console.warn('no matches found');
    return;
  }

  for (let matched of res.matches) {
    console.log(matched.data);
  }
}

query();
