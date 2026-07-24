import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL || '' });

async function queryMetrics() {
  const mplQuery = process.env.AXIOM_MPL_QUERY || 'metrics:http_requests_total';

  const res = await axiom.query(mplQuery, {
    type: 'mpl',
    startTime: process.env.AXIOM_START_TIME || '2026-06-02T10:31:37-04:00',
    endTime: process.env.AXIOM_END_TIME || '2026-06-03T10:31:37-04:00',
    edge: process.env.AXIOM_EDGE || undefined,
    edgeUrl: process.env.AXIOM_EDGE_URL || undefined,
    edgeDeployment: process.env.AXIOM_EDGE_DEPLOYMENT || 'cloud.us-east-1.aws',
    format: 'metrics-v2',
  });

  console.log(JSON.stringify(res, null, 2));
}

queryMetrics();
