# Axiom Transport for Pino logger

This is the official Axiom transport for Pino.

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/pino
```

create a pino logger with Axiom configured:

```ts
import pino from 'pino';

const logger = pino(
  { level: 'info' },
  pino.transport({
    target: '@axiomhq/pino',
    options: {
      dataset: process.env.AXIOM_DATASET,
      token: process.env.AXIOM_TOKEN,
    },
  }),
);
```

then you can use the logger as usual:

```js
logger.info('Hello from pino!');
```

For further examples, head over to the [examples](../../examples/pino) directory.

## License

Distributed under the [MIT License](../../LICENSE).
