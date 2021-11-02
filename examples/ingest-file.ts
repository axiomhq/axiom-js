import fs from 'fs';
import Client, { CloudURL } from '../lib';
import { datasets } from '../lib/datasets';

const deploymentURL = process.env.AXIOM_URL || CloudURL;
const accessToken = process.env.AXIOM_TOKEN;
const client = new Client(deploymentURL, accessToken);

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
