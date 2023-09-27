// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { Axiom } from '../../src/client';
import { mockFetchResponse } from '../lib/mock';

const clientUrl = 'https://mock.local';

describe('browser tests', () => {
  mockFetchResponse({ created: true });
  it('should run in the browser', async () => {
    expect(typeof window).toBe('object');
    const axiom = new Axiom({ url: clientUrl, token: 'test' });
    expect(axiom).toBeDefined();

    const resp = await axiom.datasets.create({ name: 'test' });
    expect(resp).toBeTruthy();
    expect(resp.created).toEqual(true);

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
