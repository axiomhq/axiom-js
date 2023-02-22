/*
 * @jest-environment jsdom
 */
import Client from '../../src/client';

const clientUrl = 'https://mock.local';
global.fetch = jest.fn().mockImplementation(() => {
    return Promise.resolve(new Response(JSON.stringify({created: true})))
});

describe('browser tests', () => {
    it('should run in the browser', async () => {
        expect(typeof window).toBe('object');
        const client = new Client({ url: clientUrl });
        expect(client).toBeDefined();


        const resp = await client.datasets.create({ name: 'test' });
        expect(resp).toBeTruthy();
        expect(resp.created).toEqual(true);

        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
