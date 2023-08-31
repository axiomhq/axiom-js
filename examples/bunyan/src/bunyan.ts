import bunyan from "bunyan"
import { AxiomStream } from '@axiomhq/bunyan'


const stream = new AxiomStream({
    dataset: process.env.AXIOM_DATASET as string,
    orgId: process.env.AXIOM_ORG_ID as string,
    token:  process.env.AXIOM_TOKEN as string,
    onError: (err) => {
        console.log({ err })
    }
})

const logger = bunyan.createLogger({ 
    name: "Example app",
    streams: [
        {
            type: 'raw',
            stream: stream,
            level: 'info'
        }
    ]

})

logger.info("Hello world!!")



