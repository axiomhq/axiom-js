import { Axiom } from "@axiomhq/js";


const axiom = new Axiom({
    token: process.env.AXIOM_TOKEN || 'xaat-f38ee86b-c372-47a8-a9c6-8cba2649ccf2',
    autoFlush: true,
    dataset: process.env.AXIOM_DATASET || 'hackernews',
})

axiom.info('Log from axiom')
axiom.debug('Log for debugging')