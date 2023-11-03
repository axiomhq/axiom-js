import { AxiomLogger } from '@axiomhq/axiomLogger';

const dataset = process.env.AXIOM_DATASET || 'logs';
const token = process.env.AXIOM_TOKEN ||  'xapt-348a872f-8466-4089-bcef-5e82052563f9'
const logger = new AxiomLogger({
  dataset,
  token,
  source: 'backend',
});

logger.info('====Hello from axiom logger=====');
logger.flush();
