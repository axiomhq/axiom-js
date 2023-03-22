// set env variables for netlify
process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = '';
process.env.NETLIFY = 'true';
process.env.AXIOM_DATASET = 'test';
process.env.AXIOM_TOKEN = 'test';

import { describe, expect, it } from '@jest/globals';
import { NetlifyAdapter } from '../../../src/adapters/netlify-adapter';
import { createLogger } from '../../../src/createLogger';
import { FetchTransport } from '../../../src/transports/fetch.transport';

describe('Netlify Detection Tests', () => {
  it('create logger in netlify browser environment', async () => {
    process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = '';
    process.env.NETLIFY = 'true';
    process.env.AXIOM_DATASET = 'test';
    process.env.AXIOM_TOKEN = 'test';
    const logger = createLogger();

    expect(logger.config.adapter).toBeInstanceOf(NetlifyAdapter);
    expect(logger.config.transport).toBeInstanceOf(FetchTransport);
  });
});
