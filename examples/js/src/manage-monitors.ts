import { monitors } from '@axiomhq/js';

const client = new monitors.Service({ token: process.env.AXIOM_TOKEN || '' });
const datasetName = 'test-axiom-js-monitors';

async function createMonitor() {
  console.log('Creating monitor...');
  const response = await client.create({
    name: 'Example CPU Monitor',
    type: 'Threshold',
    description: 'Monitor high CPU usage',
    aplQuery: `['${datasetName}'] | summarize count() by bin_auto(_time)`,
    operator: 'Above',
    threshold: 90,
    alertOnNoData: true,
    notifyByGroup: false,
    notifierIDs: [],
    intervalMinutes: 5,
    rangeMinutes: 10,
  });
  console.log(`Created monitor with ID: ${response.id}`);
  return response;
}

async function listMonitors() {
  console.log('\nListing all monitors:');
  const monitors = await client.list();
  for (const monitor of monitors) {
    console.log(`- ${monitor.name} (${monitor.id}): ${monitor.description}`);
  }
  return monitors;
}

async function getMonitor(id: string) {
  console.log(`\nGetting monitor ${id}...`);
  const response = await client.get(id);
  console.log(`Retrieved monitor: ${JSON.stringify(response, null, 2)}`);
  return response;
}

async function updateMonitor(id: string) {
  console.log('\nUpdating monitor...');
  const response = await client.update(id, {
    name: 'Updated CPU Monitor',
    type: 'Threshold',
    description: 'Monitor high CPU usage',
    aplQuery: `['${datasetName}'] | summarize count() by bin_auto(_time)`,
    operator: 'Above',
    threshold: 90,
    alertOnNoData: true,
    notifyByGroup: false,
    notifierIDs: [],
    intervalMinutes: 5,

    rangeMinutes: 10,
  });
  console.log(`Updated monitor name to: ${response.name}`);
  return response;
}

async function deleteMonitor(id: string) {
  console.log('\nDeleting monitor...');
  const response = await client.delete(id);
  console.log('Monitor deleted successfully');
  return response;
}

async function main() {
  // Create and manage a monitor
  const monitor = await createMonitor();
  await listMonitors();
  await getMonitor(monitor.id);
  await updateMonitor(monitor.id);
  await deleteMonitor(monitor.id);
}

main().catch(console.error);
