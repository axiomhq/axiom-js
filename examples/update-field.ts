const { Readable } = require("stream")
import Client, { datasets } from '@axiomhq/axiom-node';

const client = new Client();

async function ingestString() {
    const str = JSON.stringify([
        {"foo": "bar"},
        {"foo": "bar"},
        {"foo": "baz"}
    ]);
    const stream = Readable.from(str);
    const res = await client.datasets.ingest(
        'test',
        stream,
        datasets.ContentType.JSON,
        datasets.ContentEncoding.Identity,
    );
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    
    const field = await client.datasets.updateField('test', 'foo', {
        description: 'foo field updated',
        unit: 'string',
        hidden: false
    });
    console.log(field);
}

ingestString();
