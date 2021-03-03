import { expect } from 'chai';
import nock from 'nock';

import { CloudURL } from '../lib';
import NotifierService, { Type } from '../lib/notifiers';

describe('NotifierService', () => {
    beforeEach(() => {
        const notifiers = [
            {
                id: 'aqIqAfZJVTXlaSiD6r',
                name: 'Cool Kids',
                type: 'email',
                properties: {
                    UserIds: [
                        'e63a075e-393c-45ea-ac46-cf6917e930e3',
                        '6a7fe355-1303-4071-be81-75fcf45a4c0f',
                        'ab4479c4-4156-448d-a501-695e5dbf276c',
                        'c6c7381b-b24d-4107-b82e-d6cd26a490a1',
                    ],
                },
                metaCreated: '2020-12-01T21:59:32.584410925Z',
                metaModified: '2020-12-01T21:59:32.584410925Z',
                metaVersion: 1606859972584410925,
                disabledUntil: '0001-01-01T00:00:00Z',
            },
            {
                id: 'd5I2Yv3Pg2Jx9Ne2Ay',
                name: 'Notify Me',
                type: 'email',
                properties: {
                    UserIds: ['752e2388-8f6d-467a-88cc-cfba5ec407f4'],
                },
                metaCreated: '2020-12-02T08:35:57.537528976Z',
                metaModified: '2020-12-02T08:35:57.537528976Z',
                metaVersion: 1606898157537528976,
                disabledUntil: '0001-01-01T00:00:00Z',
            },
        ];

        const scope = nock(CloudURL);

        scope.get('/api/v1/notifiers').reply(200, notifiers);
        scope.get('/api/v1/notifiers/aqIqAfZJVTXlaSiD6r').reply(200, notifiers[0]);
        scope.post('/api/v1/notifiers').reply(200, notifiers[0]);
        scope.put('/api/v1/notifiers/aqIqAfZJVTXlaSiD6r').reply(200, notifiers[0]);
        scope.delete('/api/v1/notifiers/aqIqAfZJVTXlaSiD6r').reply(204);
    });

    const client = new NotifierService(CloudURL, '');
    expect(client).not.equal('undefined');

    it('List', async () => {
        const response = await client.list();
        expect(response).not.equal('undefined');
        expect(response).length(2);
    });

    it('Get', async () => {
        const response = await client.get('aqIqAfZJVTXlaSiD6r');
        expect(response).not.equal('undefined');
        expect(response.id).equal('aqIqAfZJVTXlaSiD6r');
        expect(response.name).equal('Cool Kids');
        expect(response.properties).not.empty;
    });

    it('Create', async () => {
        const notifier = {
            id: 'aqIqAfZJVTXlaSiD6r',
            name: 'Test',
            type: Type.Pagerduty,
            created: '2020-12-03T16:42:07.326658202Z',
            modified: '2020-12-03T16:42:07.326658202Z',
            version: 1607013727326658202,
        };

        const response = await client.create(notifier);
        expect(response).not.equal('undefined');
        expect(response.id).equal('aqIqAfZJVTXlaSiD6r');
        expect(response.name).equal('Cool Kids');
        expect(response.properties).not.empty;
    });

    it('Update', async () => {
        const notifier = {
            id: 'aqIqAfZJVTXlaSiD6r',
            name: 'Test',
            type: Type.Webhook,
            created: '2020-12-03T16:42:07.326658202Z',
            modified: '2020-12-03T16:42:07.326658202Z',
            version: 1607013727326658202,
        };

        const response = await client.update('aqIqAfZJVTXlaSiD6r', notifier);
        expect(response).not.equal('undefined');
        expect(response.id).equal('aqIqAfZJVTXlaSiD6r');
        expect(response.name).equal('Cool Kids');
        expect(response.properties).not.empty;
    });

    it('Delete', async () => {
        const response = await client.delete('aqIqAfZJVTXlaSiD6r');
        expect(response).not.equal('undefined');
        expect(response.status).equal(204);
    });
});
