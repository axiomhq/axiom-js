import fs from 'fs';
import Client from '../lib';
import { ContentEncoding, ContentType } from '../lib/datasets';

const deploymentURL = process.env.AXIOM_URL;
const accessToken = process.env.AXIOM_TOKEN;
const client = new Client(deploymentURL, accessToken);

async function ingestFile() {
    const stream = fs.createReadStream('logs.json');
    const res = await client.datasets.ingest('test', stream, ContentType.JSON, ContentEncoding.Identity);
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    // Ingested 3 events with 0 failures
}

ingestFile();
