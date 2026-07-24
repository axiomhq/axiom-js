import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
  url: process.env.AXIOM_URL || '',
});

async function inspectMetricsDataset() {
  const dataset = process.env.AXIOM_METRICS_DATASET || 'my-metrics-dataset';
  const info = await axiom.datasets.get(dataset);
  const options = {
    start: process.env.AXIOM_START_TIME || '2026-06-02T10:31:37-04:00',
    end: process.env.AXIOM_END_TIME || '2026-06-03T10:31:37-04:00',
    edge: process.env.AXIOM_EDGE || undefined,
    edgeUrl: process.env.AXIOM_EDGE_URL || undefined,
    edgeDeployment: process.env.AXIOM_EDGE_DEPLOYMENT || info.edgeDeployment,
  };

  console.log(`metrics dataset: ${info.name}`);
  console.log(`kind: ${info.kind}`);
  console.log(`edgeDeployment: ${info.edgeDeployment ?? 'none'}`);

  const metrics = await axiom.datasets.metrics(dataset, options);
  const metricNames = Object.keys(metrics);
  console.log(`\nmetrics (${metricNames.length}):`);
  for (const metricName of metricNames.slice(0, 20)) {
    console.log(`- ${metricName}`);
  }

  const metric = process.env.AXIOM_METRIC || metricNames[0];
  if (metric) {
    const metricTags = await axiom.datasets.metricTags(dataset, metric, options);
    console.log(`\ntags for ${metric}: ${metricTags.slice(0, 20).join(', ') || 'none'}`);

    const metricTag = process.env.AXIOM_METRIC_TAG || metricTags[0];
    if (metricTag) {
      const values = await axiom.datasets.metricTagValues(dataset, metric, metricTag, options);
      console.log(`values for ${metric}.${metricTag}: ${values.slice(0, 20).join(', ') || 'none'}`);
    }
  }

  const datasetTags = await axiom.datasets.metricDatasetTags(dataset, options);
  console.log(`\ndataset tags: ${datasetTags.slice(0, 20).join(', ') || 'none'}`);

  const datasetTag = process.env.AXIOM_DATASET_TAG || datasetTags[0];
  if (datasetTag) {
    const values = await axiom.datasets.metricDatasetTagValues(dataset, datasetTag, options);
    console.log(`values for ${datasetTag}: ${values.slice(0, 20).join(', ') || 'none'}`);
  }
}

inspectMetricsDataset().catch(console.error);
