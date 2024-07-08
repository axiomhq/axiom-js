import fs from 'fs';
import { ContentType, ContentEncoding, AxiomWithoutBatching } from '@axiomhq/js';

const axiom = new AxiomWithoutBatching({ token: process.env.AXIOM_TOKEN || ''});

async function ingestFile() {
  const buff = fs.readFileSync('logs.json');
  const res = await axiom.ingestRaw('test', buff, ContentType.JSON, ContentEncoding.Identity);
  console.log('Ingested %d events with %d failures', res.ingested, res.failed);
  // Ingested 3 events with 0 failures
}

ingestFile();
