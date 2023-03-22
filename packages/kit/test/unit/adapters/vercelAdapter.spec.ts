process.env.AXIOM_URL = undefined;
process.env.AXIOM_INGEST_ENDPOINT = 'https://axiom.co/api/v1/integrations/vercel';

import { describe, expect, it } from '@jest/globals';
import { VercelAdapter } from '../../../src/adapters/vercel-adapter';
import { LoggingSource } from '../../../src/logging/config';

describe('Vercel Adapter', () => {
  it('should read & modify ingest endpoint correctly', () => {
    let adapter = new VercelAdapter(LoggingSource.browser, true);
    let url = adapter.getIngestEndpoint();
    expect(url).toEqual('/_axiom/web-vitals');

    adapter = new VercelAdapter(LoggingSource.lambda);
    url = adapter.getIngestEndpoint();
    expect(url).toEqual('https://axiom.co/api/v1/integrations/vercel?type=logs');
  });
});
