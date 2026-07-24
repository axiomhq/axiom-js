import { datasets } from '@axiomhq/js';

export function isNotFoundError(error: unknown) {
  return error instanceof Error && /not found/i.test(error.message);
}

/**
 * cleanup after partial setup must not fail the suite twice.
 * a missing dataset means setup failed before create completed.
 */
export async function cleanupDatasetIfExists(client: datasets.Service, datasetName: string) {
  try {
    return await client.delete(datasetName);
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

/**
 * ci reruns can reuse old dataset names when github replays a run.
 * delete-before-create makes setup safe against stale state from prior attempts.
 */
export async function createTestDataset(client: datasets.Service, request: datasets.CreateRequest) {
  await cleanupDatasetIfExists(client, request.name);
  return client.create(request);
}
