process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = 'vercel';
process.env.NETLIFY = '';

import { describe, expect, it } from '@jest/globals';
import { VercelAdapter } from '../../../src/adapters/vercel-adapter';
import { createLogger } from '../../../src/createLogger';
import { FetchTransport } from '../../../src/transports/fetch.transport';

describe('Vercel Detection Tests', () => {
  it('create logger in vercel browser environment', async () => {
    const logger = createLogger();

    expect(logger.config.adapter).toBeInstanceOf(VercelAdapter);
    expect(logger.config.transport).toBeInstanceOf(FetchTransport);
  });
});
