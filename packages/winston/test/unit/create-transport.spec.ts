import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WinstonTransport } from '../../src';

const axiomMock = vi.hoisted(() => ({
  options: [] as any[],
}));

vi.mock('@axiomhq/js', () => ({
  AxiomWithoutBatching: class {
    constructor(options: any) {
      axiomMock.options.push(options);
    }
  },
}));

describe('winston transport tests', () => {
  beforeEach(() => {
    axiomMock.options = [];
  });

  it('creates a truthy instance', () => {
    const t = new WinstonTransport({ token: process.env.AXIOM_TOKEN || '' });
    expect(t).toBeTruthy();
    expect(t).toBeDefined();
  });

  it('appends winston and custom X-Axiom-Client products', () => {
    new WinstonTransport({ token: process.env.AXIOM_TOKEN || '', axiomClient: 'my-app/1.0' });

    expect(axiomMock.options[0].axiomClient).toEqual('axiom-winston/AXIOM_VERSION my-app/1.0');
  });
});
