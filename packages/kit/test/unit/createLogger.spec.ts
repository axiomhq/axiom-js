import { describe, expect, it } from '@jest/globals';
import { GenericAdapter } from '../../src/adapters/generic-adapter';
import { NetlifyAdapter } from '../../src/adapters/netlify-adapter';
import { VercelAdapter } from '../../src/adapters/vercel-adapter';
import { createLogger } from '../../src/createLogger';
import { ConsoleTransport } from '../../src/transports/console.transport';
import { FetchTransport } from '../../src/transports/fetch.transport';

describe('createLogger', () => {
  it('create generic adapter when environment is not detected', async () => {
    const logger = createLogger();

    expect(logger.config.adapter).toBeInstanceOf(GenericAdapter);
    expect(logger.config.transport).toBeInstanceOf(ConsoleTransport);
  });

  it('create logger in vercel browser environment', async () => {
    process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT = 'vercel';
    process.env.NETLIFY = '';
    const logger = createLogger();

    expect(logger.config.adapter).toBeInstanceOf(VercelAdapter);
    expect(logger.config.transport).toBeInstanceOf(FetchTransport);
  });

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
