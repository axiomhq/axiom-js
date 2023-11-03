# Axiom Transport for Axiom logger

You can use Axiom logger to send logs to Axiom. First, install the winston and @axiomhq/axiomLogger packages, then create an instance of the logger.

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/axiomLogger
```

import the Axiom Logger:

```js
import { AxiomLogger } from '@axiomhq/axiomLogger';
```

create an  Axiom logger instance with axiom transport:

```js
   const logger = new AxiomLogger({
      token: 'your-axiom-token',
      dataset: 'your-axiom-dataset',
      source: 'backend'
   })
```

then you can use the logger as usual:

```js
logger.log({
    level: 'info',
    message: 'Logger successfully setup',
});
```



:warning: Running on Edge runtime is not supported at the moment.

For further examples, head over to the [examples](../../examples/axiomLogger/) directory.

## License

Distributed under the [MIT License](../../LICENSE).
