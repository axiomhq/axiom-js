/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import DatasetsService, { Dataset } from '../../lib/datasets';
import StarredQueriesService, { StarredQuery, QueryKind } from '../../lib/starred';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';
const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('StarredQueriesService', () => {
    const datasetName = `test-axiom-node-starred-queries-${datasetSuffix}`;
    const datasetsClient = new DatasetsService(deploymentURL, accessToken);
    const client = new StarredQueriesService(deploymentURL, accessToken);

    let dataset: Dataset;
    let query: StarredQuery;

    before(async () => {
        dataset = await datasetsClient.create({
            name: datasetName,
            description: 'This is a test dataset for starred queries integration tests.',
        });

        query = await client.create({
            name: 'Test Query',
            kind: QueryKind.Stream,
            dataset: dataset.id.toString(),
        });
    });

    after(async () => {
        await client.delete(query.id!);

        await datasetsClient.delete(datasetName);
    });

    describe('update', () => {
        it('should update a query', async () => {
            const updatedQuery = await client.update(query.id!, {
                name: 'Updated Test Query',
                kind: QueryKind.Stream,
                dataset: dataset.id.toString(),
            });

            expect(updatedQuery.name).to.equal('Updated Test Query');

            query = updatedQuery;
        });
    });

    // describe('get', () => {
    //     it('should get a query', async () => {
    //         const fetchedQuery = await client.get(query.id!);

    //         expect(fetchedQuery.name).to.equal(query.name);
    //     });
    // });

    describe('list', () => {
        it('should list starred', async () => {
            const starred = await client.list({
                kind: QueryKind.Analytics,
            });

            expect(starred.length).to.be.greaterThan(0);
        });
    });
});
