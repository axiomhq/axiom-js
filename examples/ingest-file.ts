import fs from 'fs';
import Client, { ContentType, ContentEncoding } from '@axiomhq/axiom-node';

const client = new Client();

async function ingestFile() {
    const stream = fs.createReadStream('logs.json');
    const res = await client.ingest(
        'test',
        stream,
        ContentType.JSON,
        ContentEncoding.Identity,
    );
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    // Ingested 3 events with 0 failures
}

ingestFile();
