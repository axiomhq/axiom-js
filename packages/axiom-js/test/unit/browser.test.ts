/*
 * @jest-environment jsdom
 */
// axios uses xhr in the browser, and nock can't intercept that
// so we need a different mocking library for browser tests.
import mock from 'xhr-mock';
import Client from '../../src/client';

const clientUrl = 'https://mock.local';

describe('browser tests', () => {

    // replace the real XHR object with the mock XHR object before each test
    beforeEach(() => mock.setup());
    
    // put the real XHR object back and clear the mocks after each test
    afterEach(() => mock.teardown());

    it('should run in the browser', async () => {
        mock.post(clientUrl + '/v1/datasets', (_, res) => {
            return res.status(200).body({ name: 'test', created: true, id: '' })
        });

        expect(typeof window).toBe('object');
        const client = new Client({ url: clientUrl });
        expect(client).toBeDefined();

        const resp = await client.datasets.create({ name: 'test' });
        expect(resp).toBeTruthy();
        expect(resp.created).toEqual(true);
    });
});
