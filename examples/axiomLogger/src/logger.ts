import { AxiomLogger } from '@axiomhq/axiomLogger';

const dataset = process.env.AXIOM_DATASET 
const token = process.env.AXIOM_TOKEN
const logger = new AxiomLogger({
  dataset,
  token,
  source: 'backend',
});

logger.info('====Hello from axiom logger=====');
logger.flush();
