import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AxiomJSTransport } from '../../../src/transports/axiom-js';
import { createLogEvent } from '../../lib/mock';
import { Axiom, AxiomWithoutBatching } from '@axiomhq/js';

describe('AxiomJSTransport', () => {
  let mockAxiom: Axiom;
  let mockAxiomWithoutBatching: AxiomWithoutBatching;
  let transport: AxiomJSTransport;
  const DATASET = 'test-dataset';

  beforeEach(() => {
    mockAxiomWithoutBatching = Object.create(AxiomWithoutBatching.prototype, {
      ingest: { value: vi.fn() },
    });
    mockAxiom = Object.create(Axiom.prototype, {
      ingest: { value: vi.fn() },
      flush: { value: vi.fn().mockResolvedValue(undefined) },
    });
  });

  describe('with Axiom', () => {
    beforeEach(() => {
      transport = new AxiomJSTransport({ axiom: mockAxiom, dataset: DATASET });
    });

    describe('log', () => {
      it('should forward logs to axiom client ingest method', () => {
        const logs = [createLogEvent('first'), createLogEvent('second')];

        transport.log(logs);

        expect(mockAxiom.ingest).toHaveBeenCalledTimes(1);
        expect(mockAxiom.ingest).toHaveBeenCalledWith(DATASET, logs);
      });
    });

    describe('flush', () => {
      it('should call flush on axiom client', async () => {
        await transport.flush();

        expect(mockAxiom.flush).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('with AxiomWithoutBatching', () => {
    beforeEach(() => {
      transport = new AxiomJSTransport({ axiom: mockAxiomWithoutBatching, dataset: DATASET });
    });

    it('should forward logs to axiom client ingest method', () => {
      const logs = [createLogEvent('first'), createLogEvent('second')];

      transport.log(logs);

      expect(mockAxiomWithoutBatching.ingest).toHaveBeenCalledTimes(1);
      expect(mockAxiomWithoutBatching.ingest).toHaveBeenCalledWith(DATASET, logs);
    });

    it('should resolve promises when flush is called', async () => {
      const logs = [createLogEvent('first'), createLogEvent('second')];

      transport.log(logs);

      await transport.flush();

      // @ts-expect-error - private property
      expect(transport.promises).toHaveLength(0);
    });
  });
});
