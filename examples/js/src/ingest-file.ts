import fs from 'fs';
import { Client, ContentType, ContentEncoding } from '@axiomhq/js';

const client = new Client();

async function ingestFile() {
  const buff = fs.readFileSync('logs.json');
  const res = await client.ingestRaw('test', buff, ContentType.JSON, ContentEncoding.Identity);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 3 events with 0 failures
}

ingestFile();
