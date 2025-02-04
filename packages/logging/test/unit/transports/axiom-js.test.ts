import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AxiomJSTransport } from '../../../src/transports/axiom-js';
import { createLogEvent } from '../../lib/mock';

describe('AxiomJSTransport', () => {
  let mockAxiom: any;
  let transport: AxiomJSTransport;
  const DATASET = 'test-dataset';

  beforeEach(() => {
    mockAxiom = {
      ingest: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    };
    transport = new AxiomJSTransport({ axiom: mockAxiom, dataset: DATASET });
  });

  describe('log', () => {
    it('should forward logs to axiom client ingest method', () => {
      const logs = [createLogEvent('first'), createLogEvent('second')];

      transport.log(logs);

      expect(mockAxiom.ingest).toHaveBeenCalledTimes(1);
      expect(mockAxiom.ingest).toHaveBeenCalledWith(DATASET, logs);
    });

    it('should handle empty log array', () => {
      transport.log([]);

      expect(mockAxiom.ingest).toHaveBeenCalledTimes(1);
      expect(mockAxiom.ingest).toHaveBeenCalledWith(DATASET, []);
    });
  });

  describe('flush', () => {
    it('should call flush on axiom client', async () => {
      await transport.flush();

      expect(mockAxiom.flush).toHaveBeenCalledTimes(1);
    });
  });
});
