import { expect } from 'chai';

import AxiomClient from '../lib/client';

describe('AxiomClient', () => {
    it('Constructor', () => {
        const client = new AxiomClient('', '');
        expect(client).not.equal('undefined');
    });
});
