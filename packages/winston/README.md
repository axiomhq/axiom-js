# Axiom transport for Winston logger

The Axiom transport for Winston logger allows you to send data from a Node.js app to Axiom through Winston.


```ts
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new AxiomTransport({
            dataset: 'my-dataset',
            token: 'my-token',
        }),
    ],
});

logger.log({
    level: 'info',
    message: 'Logger successfully setup',
});
```

## Install

```bash
npm install @axiomhq/winston
```

## Documentation

For more information about how to set up and use the Axiom transport for Winston logger, see the [axiom.co/docs/guides/winston](https://axiom.co/docs/guides/winston).

## License

[MIT](../../LICENSE)
