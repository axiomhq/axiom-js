# Axiom JavaScript SDK

The Axiom JavaScript SDK allows you to send data from a JavaScript app to Axiom.

```ts
import { AxiomClient } from '@axiomhq/js';

const axiom = new AxiomClient({
  token: process.env.AXIOM_TOKEN,
  axiomClient: 'my-app/1.0',
});

axiom.ingest('DATASET_NAME', [{ foo: 'bar' }]);
await axiom.flush();
```

Management APIs are available as services on the same client. For example:

```ts
const apiTokens = await axiom.tokens.list();
```

The v2 management services are `annotations`, `dashboards`, `datasets`, `groups`, `monitors`, `notifiers`, `orgs`,
`roles`, `savedQueries`, `tokens`, `users`, `virtualFields`, and `views`. Their request functions and models are generated
from Axiom's public OpenAPI document, while these services provide the stable SDK interface.

Custom products are appended to the `X-Axiom-Client` header, for example `axiom-js/<version> my-app/1.0`.
You can also append products after creating the client with `axiom.appendAxiomClient('my-integration/1.0')`.

## Requirements

Node.js 22 or higher is required. Earlier Node.js versions are no longer supported.

## Install

```bash
npm install @axiomhq/js
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/guides/javascript](https://axiom.co/docs/guides/javascript).

## License

[MIT](../../LICENSE)
