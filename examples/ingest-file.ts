import fs from 'fs';

import Client from '../lib/client';
import { ContentEncoding, ContentType } from '../lib/datasets';

const depylomentURL = process.env.AXM_DEPLOYMENT_URL || '';
const accessToken = process.env.AXM_ACCESS_TOKEN || '';

const client = new Client(depylomentURL, accessToken);
const stream = fs.createReadStream('logs.json');

async function ingest() {
    const res = await client.datasets.ingest('test', stream, ContentType.JSON, ContentEncoding.Identity);
    console.log('Ingested/Failed: %d/%d', res.ingested, res.failed);
}

ingest();
