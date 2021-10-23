import { expect } from 'chai';
import { gzip } from 'zlib';

import DatasetsService, { ContentEncoding, ContentType } from '../../lib/datasets';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('DatasetsService', () => {
    const datasetName = `test-axiom-node-dataset-${datasetSuffix}`;
    const client = new DatasetsService();

    before(async () => {
        await client.create({
            name: datasetName,
            description: 'This is a test dataset for datasets integration tests.',
        });
    });

    after(async () => {
        await client.delete(datasetName);
    });

    describe('update', () => {
        it('should update the dataset', async () => {
            const dataset = await client.update(datasetName, {
                description: 'This is a soon to be filled test dataset',
            });

            expect(dataset.description).to.equal('This is a soon to be filled test dataset');
        });
    });

    describe('get', () => {
        it('should get the dataset', async () => {
            const dataset = await client.get(datasetName);

            expect(dataset.name).to.equal(datasetName);
        });
    });

    describe('list', () => {
        it('should list the datasets', async () => {
            const datasets = await client.list();

            expect(datasets.length).to.be.greaterThan(0);
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

    describe('info', () => {
        it('should get the dataset info', async () => {
            const info = await client.info(datasetName);

            expect(info.name).to.equal(datasetName);
            expect(info.numEvents).to.equal(8);
            expect(info.fields?.length).to.equal(4);
        });
    });

    describe('stats', () => {
        it('returns a valid response', async () => {
            const stats = await client.stats();

            expect(stats.datasets?.length).to.be.greaterThan(0);
        });
    });

    describe('query', () => {
        it('returns a valid response', async () => {
            const result = await client.query(datasetName, {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            });

            // expect(result.status.blocksExamined).to.equal(1);
            expect(result.status.rowsExamined).to.equal(8);
            expect(result.status.rowsMatched).to.equal(8);
            expect(result.matches?.length).to.equal(8);
        });
    });

    describe('apl query', () => {
        it('returns a valid response', async () => {
            const result = await client.aplQuery("['" + datasetName + "']");

            // expect(result.status.blocksExamined).to.equal(1);
            expect(result.status.rowsExamined).to.equal(8);
            expect(result.status.rowsMatched).to.equal(8);
            expect(result.matches?.length).to.equal(8);
        });
    });

    describe('trim', () => {
        it('returns a valid response', async () => {
            const result = await client.trim(datasetName, '1s');

            expect(result.numDeleted).to.equal(0);
        });
    });
});
