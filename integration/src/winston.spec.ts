import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import winston from 'winston';

import { Axiom } from '@axiomhq/js';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('WinstonTransport', () => {
  const datasetName = `test-axiom-js-winston-${datasetSuffix}`;
  const axiom = new Axiom({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID });
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [new AxiomTransport({ token: process.env.AXIOM_TOKEN || '', url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID, dataset: datasetName })],
  });

  beforeAll(async () => {
    await axiom.datasets.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
  });

  afterAll(async () => {
    const resp = await axiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  it('sends logs to Axiom', async () => {
    logger.log({
      level: 'info',
      message: 'Hello from winston',
      callback: (err: Error) => {
        console.error("winston failed to send logs", err)
      }
    });

    logger.end()

    logger.on('finish', () => {
      console.log('All logs have been sent');
    })

    // Wait for the log to be sent
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const startTime = new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString();
    const endTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString();

    const res = await axiom.query(`['${datasetName}']`, {
      startTime, endTime, streamingDuration: 'auto', noCache: false,
    });

    expect(res.matches).toHaveLength(1);
  });
});
