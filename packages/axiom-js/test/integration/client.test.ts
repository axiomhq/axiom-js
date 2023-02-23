import { gzip } from 'zlib';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import Client, { ContentType, ContentEncoding } from '../../src/client';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('Client', () => {
    const datasetName = `test-axiom-js-dataset-${datasetSuffix}`;
    const client = new Client();

    beforeAll(async () => {
        await client.datasets.create({
            name: datasetName,
            description: 'This is a test dataset for datasets integration tests.',
        });
    });

    afterAll(async () => {
        const resp = await client.datasets.delete(datasetName);
        expect(resp.status).toEqual(204);
    });

    describe('ingest', () => {
        it('works with a JSON payload', async () => {
            const status = await client.ingest(
                datasetName,
                `[{"foo":"bar"},{"bar":"baz"}]`,
                ContentType.JSON,
                ContentEncoding.Identity,
            );

            expect(status.ingested).toEqual(2);
            expect(status.failures?.length).toEqual(0);
        });

        it('works with a NDJSON payload', async () => {
            const status = await client.ingest(
                datasetName,
                `{"foo":"bar"}
{"bar":"baz"}`,
                ContentType.NDJSON,
                ContentEncoding.Identity,
            );

            expect(status.ingested).toEqual(2);
            expect(status.failures?.length).toEqual(0);
        });

        it('works with a CSV payload', async () => {
            const status = await client.ingest(
                datasetName,
                `foo
bar
baz`,
                ContentType.CSV,
                ContentEncoding.Identity,
            );

            expect(status.ingested).toEqual(2);
            expect(status.failures?.length).toEqual(0);
        });

        it('works with gzip', async () => {
            const encoded: Buffer = await new Promise((resolve, reject) => {
                gzip(`[{"foo":"bar"},{"bar":"baz"}]`, (err: Error | null, content: Buffer) => {
                    if (err) reject(err);
                    else resolve(content);
                });
            });

            const status = await client.ingestBuffer(datasetName, encoded, ContentType.JSON, ContentEncoding.GZIP);

            expect(status.ingested).toEqual(2);
            expect(status.failures?.length).toEqual(0);
        });

        it('works with single event', async () => {
            const status = await client.ingestEvents(datasetName, { foo: 'bar' });
            expect(status.ingested).toEqual(1);
            expect(status.failures?.length).toEqual(0);
        });

        it('works with two events', async () => {
            const status = await client.ingestEvents(datasetName, [{ foo: 'bar' }, { bar: 'baz' }]);
            expect(status.ingested).toEqual(2);
            expect(status.failures?.length).toEqual(0);
        });
    });

    describe('query', () => {
        it('returns a valid response', async () => {
            const result = await client.queryLegacy(datasetName, {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            });

            // expect(result.status.blocksExamined).toEqual(1);
            expect(result.status.rowsExamined).toEqual(11);
            expect(result.status.rowsMatched).toEqual(11);
            expect(result.matches?.length).toEqual(11);
        });
    });

    describe('apl query', () => {
        it('returns a valid response', async () => {
            const result = await client.query("['" + datasetName + "']");

            // expect(result.status.blocksExamined).toEqual(1);
            expect(result.status.rowsExamined).toEqual(11);
            expect(result.status.rowsMatched).toEqual(11);
            expect(result.matches?.length).toEqual(11);
        });
    });
});
