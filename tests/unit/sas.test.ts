import { expect } from 'chai';

import { FilterOp } from '../../lib/client'
import { sas } from '../../lib/sas';

describe('Shared Access', () => {
    it('Create Signature', async () => {
        const key = 'aba84eee-3935-4b51-8aae-2c41b8693016';
        const expSig =
            'dt=logs&fl=%7B%22op%22%3A%22%3D%3D%22%2C%22fd%22%3A%22customer%22%2C%22vl%22%3A%22vercel%22%2C%22cs%22%3Atrue%7D&met=2023-01-01T00%3A00%3A00Z&mst=2022-01-01T00%3A00%3A00Z&oi=axiom&tk=iHP9f6pQtaElHSpCBw3TSiLSy_7xsHPj01SelJ9qfWA%3D';

        const sig = sas.Signature.create(key, {
            organizationId: 'axiom',
            dataset: 'logs',
            filter: {
                op: FilterOp.Equal,
                field: 'customer',
                value: 'vercel',
                caseSensitive: true,
            },
            minStartTime: '2022-01-01T00:00:00Z',
            maxEndTime: '2023-01-01T00:00:00Z',
        });

        expect(sig).not.equal('undefined');
        expect(sig).equal(expSig);
    });

    it('Create Signature with APL filter', async () => {
        const key = 'aba84eee-3935-4b51-8aae-2c41b8693016';

        const sig = sas.Signature.create(key, {
            organizationId: 'axiom',
            dataset: 'logs',
            filter: 'customer == "vercel"',
            minStartTime: '2022-01-01T00:00:00Z',
            maxEndTime: '2023-01-01T00:00:00Z',
        });

        expect(sig).not.equal('undefined');
    });
});
