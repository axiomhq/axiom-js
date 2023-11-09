import { describe, expect, it } from 'vitest';
import { AxiomClient } from '../../src/axiomClient'


describe('AxiomClient', () => {
    it('Should be define', () => {
        const client =  new AxiomClient({
            token: '',
            orgId: '',
            dataset: ''
        })
        expect(client).toBeDefined();
    
    })
})