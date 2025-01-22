// The purpose of this example is to show how to query a dataset.
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '' });

async function query() {
  const endTime = new Date(Date.now()).toISOString();
  const startTime = new Date(new Date().getTime() - 1 * 60 * 60).toISOString(); // 1 minute
  const query = {
    startTime: startTime,
    endTime: endTime,
    resolution: 'auto',
  };

  const res = await axiom.queryLegacy('my-dataset', query);
  if (!res.matches || res.matches?.length === 0) {
    console.warn('no matches found');
    return;
  }

  for (const matched of res.matches) {
    console.log(matched.data);
  }
}

query();
