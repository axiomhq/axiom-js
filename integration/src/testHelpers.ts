import { datasets } from '@axiomhq/js';

const datasetDeletionTimeoutMs = 30_000;
const datasetDeletionPollIntervalMs = 250;

export function isNotFoundError(error: unknown) {
  return error instanceof Error && /not found/i.test(error.message);
}

async function waitForDatasetDeletion(client: datasets.Service, datasetName: string) {
  const deadline = Date.now() + datasetDeletionTimeoutMs;

  while (true) {
    try {
      await client.get(datasetName);
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }

      throw error;
    }

    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for dataset ${datasetName} to be deleted`);
    }

    await new Promise(resolve => setTimeout(resolve, datasetDeletionPollIntervalMs));
  }
}

/**
 * cleanup after partial setup must not fail the suite twice.
 * a missing dataset means setup failed before create completed.
 */
export async function cleanupDatasetIfExists(client: datasets.Service, datasetName: string) {
  try {
    await client.delete(datasetName);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }

  await waitForDatasetDeletion(client, datasetName);
}

/**
 * ci reruns can reuse old dataset names when github replays a run.
 * delete-before-create makes setup safe against stale state from prior attempts.
 */
export async function createTestDataset(client: datasets.Service, request: datasets.CreateRequest) {
  await cleanupDatasetIfExists(client, request.name);
  return client.create(request);
}
