const { Readable } = require('stream');
import Client, { ContentType, ContentEncoding  } from '@axiomhq/axiom-js';

const client = new Client();

async function ingestString() {
    const str = JSON.stringify([{ foo: 'bar' }, { foo: 'bar' }, { bar: 'baz' }]);
    const stream = Readable.from(str);
    const res = await client.ingest(
        'test',
        stream,
        ContentType.JSON,
        ContentEncoding.Identity,
    );
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    // Ingested 3 events with 0 failures
}

ingestString();
