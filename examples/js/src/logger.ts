import { Axiom, Logger } from "@axiomhq/js";

const client = new Axiom({ token: process.env.AXIOM_TOKEN || ''});

const logger = new Logger({ client, dataset: process.env.AXIOM_DATASET || '' , autoFlush: true })

logger.info('hello world')
