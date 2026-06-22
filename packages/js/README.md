# Axiom JavaScript SDK

The Axiom JavaScript SDK allows you to send data from a JavaScript app to Axiom.

```ts
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
  axiomClient: 'my-app/1.0',
});

axiom.ingest('DATASET_NAME', [{ foo: 'bar' }]);
await axiom.flush();
```

Custom products are appended to the `Axiom-Client` header, for example `axiom-js/<version> my-app/1.0`.
You can also append products after creating the client with `axiom.appendAxiomClient('my-integration/1.0')`.

## Requirements

Node.js 20 or higher is required. Node.js 18 is no longer supported.

## Install

```bash
npm install @axiomhq/js
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/guides/javascript](https://axiom.co/docs/guides/javascript).

## License

[MIT](../../LICENSE)
