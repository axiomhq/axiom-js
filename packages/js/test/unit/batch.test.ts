import { fail } from 'assert';
import { Batch } from '../../lib/batch';

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Batch', () => {
    it('sends events after 1s', async () => {
        jest.useFakeTimers();
        const sendFn = jest.fn();

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });
        batch.ingestEvents({ foo: 'bar' });
        batch.ingestEvents({ foo: 'baz' });

        expect(sendFn).not.toHaveBeenCalled();
        jest.runAllTimers();
        jest.useRealTimers();
        await sleep(100); // async code yay

        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events after 1k events', async () => {
        const sendFn = jest.fn();

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        let events = [];
        for (let i = 0; i < 1000; i++) {
            batch.ingestEvents({ foo: 'bar' });
        }

        await sleep(100); // just make sure we have enough time
        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events after 1s when ingesting one event every 100ms', async () => {
        jest.useFakeTimers();
        const sendFn = jest.fn();

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        for (let i = 0; i < 10; i++) {
            batch.ingestEvents({ foo: 'bar' });
            jest.advanceTimersByTime(120);
        }

        jest.useRealTimers();
        await sleep(100); // just make sure we have enough time
        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('sends events on flush', async () => {
        const sendFn = jest.fn();

        const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

        for (let i = 0; i < 10; i++) {
            batch.ingestEvents({ foo: 'bar' });
        }

        expect(sendFn).toHaveBeenCalledTimes(0);
        await batch.flush();
        expect(sendFn).toHaveBeenCalledTimes(1);
    });
});
