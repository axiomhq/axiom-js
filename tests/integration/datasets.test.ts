import { expect } from 'chai';
import { gzip } from 'zlib';

import DatasetsService, { ContentEncoding, ContentType } from '../../lib/datasets';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';
const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('DatasetsService', () => {
    const datasetName = `test-axiom-node-${datasetSuffix}`;
    const client = new DatasetsService(deploymentURL, accessToken);

    before(async () => {
        await client.create({
            name: datasetName,
            description: 'Automatically created by axiom-node integration tests.',
        });
    });

    after(async () => {
        await client.delete(datasetName);
    });

    describe('stats', () => {
        it('returns a valid response', async () => {
            const stats = await client.stats();
            expect(stats.datasets?.length).to.be.greaterThan(0);
        });
    });

    describe('ingest', () => {
        it('works with a JSON payload', async () => {
            const status = await client.ingestString(
                datasetName,
                `[{"foo":"bar"},{"bar":"baz"}]`,
                ContentType.JSON,
                ContentEncoding.Identity,
            );
            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });

        it('works with a NDJSON payload', async () => {
            const status = await client.ingestString(
                datasetName,
                `{"foo":"bar"}
{"bar":"baz"}`,
                ContentType.NDJSON,
                ContentEncoding.Identity,
            );
            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });

        it('works with a CSV payload', async () => {
            const status = await client.ingestString(
                datasetName,
                `foo
bar
baz`,
                ContentType.CSV,
                ContentEncoding.Identity,
            );
            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });

        it('works with gzip', async () => {
            const encoded: Buffer = await new Promise((resolve, reject) => {
                gzip(`[{"foo":"bar"},{"bar":"baz"}]`, (err: Error | null, content: Buffer) => {
                    if (err) reject(err);
                    else resolve(content);
                });
            });

            const status = await client.ingestBuffer(datasetName, encoded, ContentType.JSON, ContentEncoding.GZIP);
            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });
    });
});
