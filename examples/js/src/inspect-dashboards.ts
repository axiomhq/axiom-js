import { Axiom, type dashboards } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
  url: process.env.AXIOM_URL || '',
});

function dashboardName(resource: dashboards.DashboardResource): string {
  const name = resource.dashboard.name;
  return typeof name === 'string' ? name : resource.uid;
}

async function inspectDashboards() {
  const dashboards = await axiom.dashboards.list({
    limit: Number(process.env.AXIOM_DASHBOARD_LIMIT || 10),
    offset: Number(process.env.AXIOM_DASHBOARD_OFFSET || 0),
  });

  console.log(`dashboards: ${dashboards.length}`);
  for (const dashboard of dashboards.slice(0, 10)) {
    console.log(`- ${dashboardName(dashboard)} (${dashboard.uid})`);
  }

  const uid = process.env.AXIOM_DASHBOARD_UID || dashboards[0]?.uid;
  if (!uid) {
    return;
  }

  const dashboard = await axiom.dashboards.get(uid);
  console.log(`\nselected dashboard: ${dashboardName(dashboard)}`);
  console.log(`uid: ${dashboard.uid}`);
  console.log(`version: ${dashboard.version ?? 'unknown'}`);
}

inspectDashboards().catch(console.error);
