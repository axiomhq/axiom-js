import { expect } from 'chai';
import { gzip } from 'zlib';

import  Client, { ContentType, ContentEncoding } from '../../lib/client';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('Client', () => {
    const datasetName = `test-axiom-node-dataset-${datasetSuffix}`;
    const client = new Client();

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

            const status = await client.ingestBuffer(
                datasetName,
                encoded,
                ContentType.JSON,
                ContentEncoding.GZIP,
            );

            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });

        it('works with single event', async () => {
            const status = await client.ingestEvents(datasetName, { foo: 'bar' });
            expect(status.ingested).to.equal(1);
            expect(status.failures?.length).to.equal(0);
        });

        it('works with two events', async () => {
            const status = await client.ingestEvents(datasetName, [{ foo: 'bar' }, { bar: 'baz' }]);
            expect(status.ingested).to.equal(2);
            expect(status.failures?.length).to.equal(0);
        });
    });

    describe('query', () => {
        it('returns a valid response', async () => {
            const result = await client.queryLegacy(datasetName, {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            });

            // expect(result.status.blocksExamined).to.equal(1);
            expect(result.status.rowsExamined).to.equal(11);
            expect(result.status.rowsMatched).to.equal(11);
            expect(result.matches?.length).to.equal(11);
        });
    });

    describe('apl query', () => {
        it('returns a valid response', async () => {
            const result = await client.query("['" + datasetName + "']");

            // expect(result.status.blocksExamined).to.equal(1);
            expect(result.status.rowsExamined).to.equal(11);
            expect(result.status.rowsMatched).to.equal(11);
            expect(result.matches?.length).to.equal(11);
        });
    });
});
