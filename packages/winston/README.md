# Axiom Transport for Winston logger

You can use Winston logger to send logs to Axiom. First, install the winston and @axiomhq/winston packages, then create an instance of the logger with the AxiomTransport.

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/winston
```

import the axiom transport for winston:

```js
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';
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
        new AxiomTransport({
            dataset: 'my-dataset', // defaults to process.env.AXIOM_DATASET
            token: 'my-token', // defaults to process.env.AXIOM_TOKEN
            orgId: 'my-org-id', // defaults to process.env.AXIOM_ORG_ID
        }),
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

### Error, exception and rejection handling

If you want to log `Error`s, we recommend using the
[`winston.format.errors`](https://github.com/winstonjs/logform#errors)
formatter, for example like this:

```ts
import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';
const { combine, errors, stack } = winston.format;
const axiomTransport = new AxiomTransport({ ... });
const logger = winston.createLogger({
  // 8<----snip----
  format: combine(errors({ stack: true }), json()),
  // 8<----snip----
});
```

To automatically log exceptions and rejections, add the Axiom transport to the
[`exceptionHandlers`](https://github.com/winstonjs/winston#exceptions) and
[`rejectionHandlers`](https://github.com/winstonjs/winston#rejections) like
this:

```ts
import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';
const axiomTransport = new AxiomTransport({ ... });
const logger = winston.createLogger({
  // 8<----snip----
  transports: [axiomTransport],
  exceptionHandlers: [axiomTransport],
  rejectionHandlers: [axiomTransport],
  // 8<----snip----
});
```

:warning: Running on Edge runtime is not supported at the moment.

For further examples, head over to the [examples](../../examples/winston/) directory.

## License

Distributed under the [MIT License](../../LICENSE).
