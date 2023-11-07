import { Logger } from '@axiomhq/js'

const logger = new Logger({
    source: 'web',
    autoFlush: true,
    token: process.env.AXIOM_TOKEN || '',
    dataset: process.env.AXIOM_dataset || ''
})

logger.info("Hello Axiom");
logger.flush()