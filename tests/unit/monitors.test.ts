import { expect } from 'chai';
import nock from 'nock';

import { monitors } from '../../lib/monitors';

describe('MonitorsService', () => {
    const client = new monitors.Service('http://axiom-node.dev.local');

    beforeEach(() => {
        const mockMonitors: monitors.Monitor[] = [
            {
                id: 'nGxDh3TGuidQJgJW3s',
                name: 'Test',
                description: 'A test monitor',
                disabledUntil: '0001-01-01T00:00:00Z',
                aplQuery: false,
                query: {
                    startTime: '2020-11-30T14:28:29Z',
                    endTime: '2020-11-30T14:33:29Z',
                    resolution: '1s',
                },
                dataset: 'test',
                threshold: 1000,
                comparison: monitors.Comparison.AboveOrEqual,
                frequencyMinutes: 1,
                durationMinutes: 5,
                lastCheckTime: '2020-11-30T14:37:13Z',
            },
            {
                id: 'lrR66wmzYm9NKtq0rz',
                name: 'Test',
                description: 'A test monitor',
                disabledUntil: '0001-01-01T00:00:00Z',
                aplQuery: true,
                query: {
                    startTime: '0001-01-01T00:00:00Z',
                    endTime: '0001-01-01T00:00:00Z',
                    apl: 'test | count'
                },
                dataset: 'test',
                threshold: 0,
                comparison: monitors.Comparison.Below,
                frequencyMinutes: 0,
                durationMinutes: 0,
                lastCheckTime: '0001-01-01T00:00:00Z',
            },
        ];

        const scope = nock('http://axiom-node.dev.local');

        scope.get('/api/v1/monitors').reply(200, mockMonitors);
        scope.get('/api/v1/monitors/nGxDh3TGuidQJgJW3s').reply(200, mockMonitors[0]);
        scope.post('/api/v1/monitors').reply(200, mockMonitors[1]);
        scope.put('/api/v1/monitors/lrR66wmzYm9NKtq0rz').reply(200, mockMonitors[1]);
        scope.delete('/api/v1/monitors/lrR66wmzYm9NKtq0rz').reply(204);
    });

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('nGxDh3TGuidQJgJW3s');
        expect(response).not.equal('undefined');
        expect(response.id).equal('nGxDh3TGuidQJgJW3s');
        expect(response.name).equal('Test');
        expect(response.description).equal('A test monitor');
        expect(response.query).not.empty;
    });

    it('Create', async () => {
        const monitor: monitors.Monitor = {
            name: 'Test',
            description: 'A test monitor',
            dataset: 'test',
            comparison: monitors.Comparison.Below,
            aplQuery: false,
            query: {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            },
            threshold: 0,
            frequencyMinutes: 0,
            durationMinutes: 0,
        };

        const response = await client.create(monitor);
        expect(response).not.equal('undefined');
        expect(response.id).equal('lrR66wmzYm9NKtq0rz');
        expect(response.name).equal('Test');
        expect(response.description).equal('A test monitor');
        // expect(response.query).not.empty;
    });

    it('Update', async () => {
        const monitor: monitors.Monitor = {
            name: 'Test',
            description: 'A test monitor',
            dataset: 'test',
            comparison: monitors.Comparison.Below,
            aplQuery: false,
            query: {
                startTime: '2018-01-01T00:00:00.000Z',
                endTime: '2028-01-01T00:00:00.000Z',
                resolution: 'auto',
            },
            threshold: 0,
            frequencyMinutes: 0,
            durationMinutes: 0,
        };

        const response = await client.update('lrR66wmzYm9NKtq0rz', monitor);
        expect(response).not.equal('undefined');
        expect(response.id).equal('lrR66wmzYm9NKtq0rz');
        expect(response.name).equal('Test');
        expect(response.description).equal('A test monitor');
        expect(response.query).not.empty;
    });

    it('Delete', async () => {
        const response = await client.delete('lrR66wmzYm9NKtq0rz');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
