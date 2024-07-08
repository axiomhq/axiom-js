## Javascript SDK for Axiom

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/js
```

If you use the [Axiom CLI](https://github.com/axiomhq/cli), run `eval $(axiom config export -f)` to configure your environment variables.

Otherwise create a new token in [the Axiom settings](https://app.axiom.co/api-tokens) and export it as `AXIOM_TOKEN`.

You can also configure the client using options passed to the constructor of the Client:

```ts
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
});
```

You can then ingest data like this:

```ts
axiom.ingest('my-dataset', [{ foo: 'bar' }]);
await axiom.flush();
```

> **Note** that the client is automatically batching events in the background, in most cases you'll only want to call `flush()` before your application exits.

And query data like this:

```ts
const res = await axiom.query(`['my-dataset'] | where foo == 'bar' | limit 100`);
console.log(res);
```

For further examples, head over to the [examples](../../examples/js) directory.


## Capture Errors

To capture errors, you can pass a method `onError` to the client:

```ts
let client = new Axiom({
  token: '',
  ...,
  onError: (err) => {
    console.error('ERROR:', err);
  }
});
```
by default `onError` is set to `console.error`.


## Annotations

Starting from `v1.0.0` the SDK supports the [Annotations API](https://axiom.co/docs/restapi/endpoints/createAnnotation). You can create annotations like this:

```ts
// import the annotations module
import { annotations } from '@axiomhq/js';
// create a client
const client = new annotations.Service({ token: process.env.AXIOM_TOKEN });
```

Then create an annotation like this:

```ts
await annotations.create({
  type: 'deployment',
  datasets: ['dataset_name'],
  title: 'New deployment',
  description: 'Deployed version 1.0.0 with fixes for ...',
})
```
