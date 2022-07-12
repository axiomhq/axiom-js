import { expect } from 'chai';

import { datasets } from '../../lib/datasets';
import { starred } from '../../lib/starred';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('StarredQueriesService', () => {
    const datasetName = `test-axiom-node-starred-queries-${datasetSuffix}`;
    const datasetsClient = new datasets.Service();
    const client = new starred.Service();

    let dataset: datasets.Dataset;
    let query: starred.StarredQuery;

    before(async () => {
        dataset = await datasetsClient.create({
            name: datasetName,
            description: 'This is a test dataset for starred queries integration tests.',
        });

        query = await client.create({
            name: 'Test Query',
            kind: starred.QueryKind.Analytics,
            dataset: dataset.id.toString(),
            query: {
                apl: "['" + datasetName + "']"
            }
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
                kind: starred.QueryKind.Analytics,
                dataset: dataset.id.toString(),
                query: {
                    apl: "['" + datasetName + "']"
                }
            });

            expect(updatedQuery.name).to.equal('Updated Test Query');

            query = updatedQuery;
        });
    });

    describe('get', () => {
        it('should get a query', async () => {
            const fetchedQuery = await client.get(query.id!);

            expect(fetchedQuery.name).to.equal(query.name);
        });
    });

    describe('list', () => {
        it('should list starred', async () => {
            const starredList = await client.list({
                dataset: datasetName,
                kind: starred.QueryKind.Analytics,
                who: starred.OwnerKind.User,
            });

            expect(starredList.length).to.be.greaterThan(0);
            expect(starredList[0].id).eq(query.id);
        });
    });
});
