# Axiom Stream for Bunyan logger

This is the official Axiom Stream for Bunyan.

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/bunyan
```

create a Bunyan logger with Axiom configured:

```ts
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
```

then you can use the logger as usual:

```js
logger.info('Hello from Bunyan!');
```

For further examples, head over to the [examples](../../examples/bunyan) directory.

## License

Distributed under the [MIT License](../../LICENSE).
