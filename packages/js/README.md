## Javascript SDK for Axiom

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/js
```

If you use the [Axiom CLI](https://github.com/axiomhq/cli), run `eval $(axiom config export -f)` to configure your environment variables.

Otherwise create a personal token in [the Axiom settings](https://app.axiom.co/profile) and export it as `AXIOM_TOKEN`. Set `AXIOM_ORG_ID` to the organization ID from the settings page of the organization you want to access.

You can also configure the client using options passed to the constructor of the Client:

```ts
const client = new Client({
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID,
});
```

Create and use a client like this:

```ts
import Client from '@axiomhq/js';

async function main() {
  const client = new Client();

  client.ingest('my-dataset', [
    { 'foo': 'bar'},
  ]);
  await client.flush();

  const res = await client.query(`['my-dataset'] | where foo == 'bar' | limit 100`);
}
```

For further examples, head over to the [examples](../../examples/js) directory.