import { expect } from 'chai';

import Client from '../lib/client';

describe('Client', () => {
    const client = new Client('', '');
    expect(client).not.equal('undefined');

    it('Services', () => {
        expect(client.monitors).not.empty;
        expect(client.notifiers).not.empty;
        expect(client.users).not.empty;
        expect(client.version).not.empty;
        expect(client.virtualFields).not.empty;
    });
});
