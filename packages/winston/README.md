# Axiom Transport for Winston logger

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/winstom-axiom
```

import the axiom transport for winston:

```js
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston-axiom';
```

create a winston logger instance with axiom transport:

```js
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        // You can pass an option here, if you don't the transport is configured automatically
        // using environment variables like `AXIOM_DATASET` and `AXIOM_TOKEN`
        new AxiomTransport(),
    ],
});
```

then you can use the logger as usual:

```js
logger.log({
    level: 'info',
    message: 'Logger successfuly setup',
});
```

:warning: Running on Edge runtime is not supported at the moment.

For further examples, head over to the [examples](../../examples) directory.

## License

Distributed under the [MIT License](../../LICENSE).
