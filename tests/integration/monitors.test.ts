import { expect } from 'chai';

import { datasets } from '../../lib/datasets';
import { monitors } from '../../lib/monitors';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('MonitorsService', () => {
    const datasetName = `test-axiom-node-monitors-${datasetSuffix}`;
    const datasetsClient = new datasets.Service();
    const client = new monitors.Service();

    let monitor: monitors.Monitor;

    before(async () => {
        const dataset = await datasetsClient.create({
            name: datasetName,
            description: 'This is a test dataset for monitors integration tests.',
        });

        monitor = await client.create({
            name: 'Test Monitor',
            description: 'A test monitor',
            dataset: dataset.name,
            comparison: monitors.Comparison.AboveOrEqual,
            query: {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            },
            frequencyMinutes: 1,
            durationMinutes: 5,
        });
    });

    after(async () => {
        await client.delete(monitor.id!);

        await datasetsClient.delete(datasetName);
    });

    describe('update', () => {
        it('should update a monitor', async () => {
            const updatedMonitor = await client.update(monitor.id!, {
                name: 'Updated Test Monitor',
                description: 'A very good test monitor',
                dataset: datasetName,
                comparison: monitors.Comparison.AboveOrEqual,
                query: {
                    startTime: '2018-01-01T00:00:00.000Z',
                    endTime: '2028-01-01T00:00:00.000Z',
                    resolution: 'auto',
                },
                frequencyMinutes: 1,
                durationMinutes: 5,
            });

            expect(updatedMonitor.name).to.equal('Updated Test Monitor');
            expect(updatedMonitor.description).to.equal('A very good test monitor');

            monitor = updatedMonitor;
        });
    });

    describe('get', () => {
        it('should get a monitor', async () => {
            const fetchedMonitor = await client.get(monitor.id!);

            expect(fetchedMonitor.name).to.equal(monitor.name);
            expect(fetchedMonitor.description).to.equal(monitor.description);
            expect(fetchedMonitor.dataset).to.equal(monitor.dataset);
        });
    });

    describe('list', () => {
        it('should list monitors', async () => {
            const monitors = await client.list();

            expect(monitors.length).to.be.greaterThan(0);
        });
    });
});
