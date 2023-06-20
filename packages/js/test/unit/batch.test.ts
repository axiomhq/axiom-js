import { describe, expect, it, vi } from 'vitest'
import { Batch, IngestFunction } from '../../src/batch';

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Batch', () => {
    it('sends events after 1s', async () => {
        vi.useFakeTimers();
        const sendFn = vi.fn() as IngestFunction;

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });
        batch.ingest({ foo: 'bar' });
        batch.ingest({ foo: 'baz' });

        expect(sendFn).not.toHaveBeenCalled();
        vi.runAllTimers();
        vi.useRealTimers();
        await sleep(100); // async code yay

        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events after 1k events', async () => {
        const sendFn = vi.fn() as IngestFunction;;

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        for (let i = 0; i < 1000; i++) {
            batch.ingest({ foo: 'bar' });
        }

        await sleep(100); // just make sure we have enough time
        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events after 1s when ingesting one event every 100ms', async () => {
        vi.useFakeTimers();
        const sendFn = vi.fn() as IngestFunction;;

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        for (let i = 0; i < 10; i++) {
            batch.ingest({ foo: 'bar' });
            vi.advanceTimersByTime(120);
        }

        vi.useRealTimers();
        await sleep(100); // just make sure we have enough time
        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events on flush', async () => {
        const sendFn = vi.fn() as IngestFunction;;

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        for (let i = 0; i < 10; i++) {
            batch.ingest({ foo: 'bar' });
        }

        expect(sendFn).toHaveBeenCalledTimes(0);
        await batch.flush();
        expect(sendFn).toHaveBeenCalledTimes(1);
    });
});
