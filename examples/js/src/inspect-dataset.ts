import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
  url: process.env.AXIOM_URL || '',
});

async function inspectDataset() {
  const dataset = process.env.AXIOM_DATASET || 'my-dataset';

  const info = await axiom.datasets.get(dataset);
  console.log(`dataset: ${info.name}`);
  console.log(`kind: ${info.kind}`);
  console.log(`edgeDeployment: ${info.edgeDeployment ?? 'none'}`);
  console.log(`retentionDays: ${info.retentionDays ?? 'default'}`);
  console.log(`mapFields from metadata: ${JSON.stringify(info.mapFields ?? null)}`);

  const fields = await axiom.datasets.fields(dataset);
  console.log(`\nfields (${fields.length}):`);
  for (const field of fields.slice(0, 20)) {
    console.log(`- ${field.name}: ${field.type}`);
  }

  const mapFields = await axiom.datasets.mapFields(dataset);
  console.log(`\nmapFields: ${JSON.stringify(mapFields)}`);
}

inspectDataset().catch(console.error);
