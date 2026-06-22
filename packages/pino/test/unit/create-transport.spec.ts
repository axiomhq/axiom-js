import { describe, it, expect, vi, beforeEach } from 'vitest';
import axiomTransport from '../../src';

const axiomMock = vi.hoisted(() => ({
  options: [] as any[],
}));

vi.mock('@axiomhq/js', () => ({
  Axiom: class {
    constructor(options: any) {
      axiomMock.options.push(options);
    }

    ingest = vi.fn();
    flush = vi.fn();
  },
}));

describe('pino transport tests', () => {
  beforeEach(() => {
    axiomMock.options = [];
  });

  it('creates a truthy instance', async () => {
    const t = await axiomTransport({ token: process.env.AXIOM_TOKEN || '', dataset: process.env.AXIOM_DATASET || '' });
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });

  it('appends pino and custom Axiom-Client products', async () => {
    await axiomTransport({
      token: process.env.AXIOM_TOKEN || '',
      dataset: process.env.AXIOM_DATASET || '',
      axiomClient: 'my-app/1.0',
    });

    expect(axiomMock.options[0].axiomClient).toEqual('axiom-pino/AXIOM_VERSION my-app/1.0');
  });
});
