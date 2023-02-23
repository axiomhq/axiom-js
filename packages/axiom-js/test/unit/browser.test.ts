/*
 * @jest-environment jsdom
 */
import { describe, expect, it } from '@jest/globals';

import Client from '../../src/client';
import { mockFetchResponse } from '../lib/mock';

const clientUrl = 'https://mock.local';

describe('browser tests', () => {
    mockFetchResponse({ created: true });
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
