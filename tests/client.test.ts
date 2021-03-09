import { expect } from 'chai';

import Client from '../lib/client';

describe('Client', () => {
    const client = new Client('', '');
    expect(client).not.equal('undefined');

    it('Services', () => {
        expect(client.datasets).not.empty;
        expect(client.monitors).not.empty;
        expect(client.notifiers).not.empty;
        expect(client.starred).not.empty;
        expect(client.teams).not.empty;
        expect(client.tokens.ingest).not.empty;
        expect(client.tokens.personal).not.empty;
        expect(client.users).not.empty;
        expect(client.version).not.empty;
        expect(client.virtualFields).not.empty;
    });
});
