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
        transports: [new AxiomTransport({ dataset: datasetName })],
    });

    before(async () => {
        await client.datasets.create({
            name: datasetName,
            description: 'This is a test dataset for datasets integration tests.',
        });
    });

    after(async () => {
        const resp = await client.datasets.delete(datasetName);
        expect(resp.status).to.equal(204);
        
    });

    it('sends logs to Axiom', async () => {
        logger.log({
            level: 'info',
            message: 'Hello from winston',
        });

        // Wait for the log to be sent
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const startTime = new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString();
        const endTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString();

        // const res = await client.datasets.aplQuery(`['${datasetName}']`, {
        //     startTime, endTime, streamingDuration: 'auto', noCache: false,
        // });

        const res = await client.datasets.query(datasetName, {
            resolution: 'auto',
            startTime,
            endTime,
        });
        expect(res.matches).to.have.a.lengthOf(1);
    });
});
