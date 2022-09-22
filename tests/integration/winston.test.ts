import { expect } from 'chai';
import winston from 'winston';

import Client from '../../lib/client';
import { WinstonTransport as AxiomTransport } from '../../lib/logger';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('WinstonTransport', () => {
    const datasetName = `test-axiom-node-winston-${datasetSuffix}`;
    const client = new Client();
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            // You can pass an option here, if you don't the transport is configured
            // using environment variables like `AXIOM_DATASET` and `AXIOM_TOKEN`
            new AxiomTransport(),
        ],
    });

    before(async () => {
        await client.datasets.create({
            name: datasetName,
            description: 'This is a test dataset for datasets integration tests.',
        });
    });

    after(async () => {
        await client.datasets.delete(datasetName);
    });

    it('sends logs to Axiom', async () => {
        logger.log({
            level: 'info',
            message: 'Hello from winston',
        });

        // Wait for the log to be sent
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const res = await client.datasets.aplQuery(`['${datasetName}']`);
        expect(res.matches).to.have.a.lengthOf(1);
    });
});
