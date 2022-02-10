import fs from 'fs';
import Client, { datasets } from '@axiomhq/axiom-node';

const client = new Client();

async function ingestFile() {
    const stream = fs.createReadStream('logs.json');
    const res = await client.datasets.ingest(
        'test',
        stream,
        datasets.ContentType.JSON,
        datasets.ContentEncoding.Identity,
    );
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    // Ingested 3 events with 0 failures
}

ingestFile();
