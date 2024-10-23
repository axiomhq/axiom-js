# Axiom transport for Pino logger

The Axiom transport for Pino logger allows you to send data from a Node.js app to Axiom through Pino.

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

## Install

```bash
npm install @axiomhq/pino
```


## Documentation

For more information about how to set up and use the Axiom transport for Pino logger, see the [axiom.co/docs/guides/pino](https://axiom.co/docs/guides/pino).

## License

[MIT](../../LICENSE)
