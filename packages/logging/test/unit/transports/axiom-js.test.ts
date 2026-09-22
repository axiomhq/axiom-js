import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AxiomJSTransport, axiomClient } from '../../../src/transports/axiom-js';
import { createLogEvent } from '../../lib/mock';
import { AxiomClient, AxiomClientWithoutBatching } from '@axiomhq/js';
import { LogLevel } from 'src/logger';

describe('AxiomJSTransport', () => {
  let mockAxiom: AxiomClient;
  let mockAxiomClientWithoutBatching: AxiomClientWithoutBatching;
  let transport: AxiomJSTransport;
  const DATASET = 'test-dataset';

  beforeEach(() => {
    mockAxiomClientWithoutBatching = Object.create(AxiomClientWithoutBatching.prototype, {
      ingest: { value: vi.fn() },
      appendAxiomClient: { value: vi.fn() },
    });
    mockAxiom = Object.create(AxiomClient.prototype, {
      ingest: { value: vi.fn() },
      flush: { value: vi.fn().mockResolvedValue(undefined) },
      appendAxiomClient: { value: vi.fn() },
    });
  });

  describe('with AxiomClient', () => {
    beforeEach(() => {
      transport = new AxiomJSTransport({ axiom: mockAxiom, dataset: DATASET });
    });

    describe('log', () => {
      it('should forward logs to axiom client ingest method', () => {
        const logs = [createLogEvent(LogLevel.info, 'first'), createLogEvent(LogLevel.info, 'second')];

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

    describe('appendAxiomClient', () => {
      it('should append logging X-Axiom-Client product when created', () => {
        expect((mockAxiom as any).appendAxiomClient).toHaveBeenCalledWith(axiomClient);
      });

      it('should append custom X-Axiom-Client products after logging product', () => {
        transport = new AxiomJSTransport({
          axiom: mockAxiom,
          dataset: DATASET,
          axiomClient: 'axiom-react/0.0.0',
        });

        expect((mockAxiom as any).appendAxiomClient).toHaveBeenLastCalledWith(`${axiomClient} axiom-react/0.0.0`);
      });

      it('should append X-Axiom-Client products through the transport method', () => {
        transport.appendAxiomClient?.('my-app/1.0');

        expect((mockAxiom as any).appendAxiomClient).toHaveBeenCalledWith('my-app/1.0');
      });
    });
  });

  describe('with AxiomClientWithoutBatching', () => {
    beforeEach(() => {
      transport = new AxiomJSTransport({ axiom: mockAxiomClientWithoutBatching, dataset: DATASET });
    });

    it('should forward logs to axiom client ingest method', () => {
      const logs = [createLogEvent(LogLevel.info, 'first'), createLogEvent(LogLevel.info, 'second')];

      transport.log(logs);

      expect(mockAxiomClientWithoutBatching.ingest).toHaveBeenCalledTimes(1);
      expect(mockAxiomClientWithoutBatching.ingest).toHaveBeenCalledWith(DATASET, logs);
    });

    it('should resolve promises when flush is called', async () => {
      const logs = [createLogEvent(LogLevel.info, 'first'), createLogEvent(LogLevel.info, 'second')];

      transport.log(logs);

      await transport.flush();

      // @ts-expect-error - private property
      expect(transport.promises).toHaveLength(0);
    });
  });
});
