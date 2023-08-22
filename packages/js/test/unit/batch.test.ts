import { describe, expect, it, vi } from 'vitest'
import { Batch, IngestFunction } from '../../src/batch';
import { IngestStatus } from '../../src/client';

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

    expect(sendFn).toHaveBeenCalledWith('my-dataset', [{ foo: 'bar' }, { foo: 'baz' }], { timestampField: 'foo' });
    expect(batch.events).toEqual([]);
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

  it("doesn't drop events after multiple flushes in a row", async () => {
    // This test is a regression test for a bug that could lead to dropped
    // events.
    //
    // A timeline:
    // 1. The first event is ingested and flush is called automatically
    // 2. A second event is ingested, flush is called again and and waits for
    //    the first flush to complete
    // 3. The first flush ingests the first event and clears the events array
    // 4. The second flush continues execution but the events array is empty

    // We want to wait for the first ingest to be called before adding the
    // second event. Without waiting we'd add our event to the events array ref
    // and the first flush would ingest both events.
    let sentEventsCalled: (value: any) => void;
    let sentEventsCalledPromise = new Promise((resolve) => (sentEventsCalled = resolve));

    let sentEvents: Array<object> = [];
    const sendFn = async (_id: string, events: Array<object> | object) => {
      sentEventsCalled({});

      if (Array.isArray(events)) {
        sentEvents = sentEvents.concat(events);
      } else {
        sentEvents.push(events);
      }

      return {};
    };

    // @ts-ignore
    const batch = new Batch(sendFn, 'my-dataset', { timestampField: 'foo' });

    let secondFlushDone: Promise<IngestStatus | void>;
    // 1. Ingest one event
    batch.events.push({ foo: 'bar' });
    // 2. Flush that event and wait for it to be sent (in reality this would be
    //    network time)
    batch.activeFlush = batch.flush();
    await sentEventsCalledPromise;
    // 3. Ingest a second event
    batch.events.push({ foo: 'baz' });
    // 4. Flush the second event
    secondFlushDone = batch.activeFlush = batch.flush();
    // Wait for the second flush to complete (it'll abort early because of the
    // empty array.
    await secondFlushDone;
    // Make sure we ingested both events
    expect(sentEvents).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
  });
});
