# axiom-node [![Workflow][workflow_badge]][workflow] [![Latest Release][release_badge]][release] [![License][license_badge]][license]

![Alt](https://repobeats.axiom.co/api/embed/40b1a942132e3f515d5374bde5e47fb0750eb411.svg "Repobeats analytics image")

The Node SDK for [Axiom](https://www.axiom.co/).

## Quickstart

Install the package:

```shell
npm install @axiomhq/axiom-node
```

Then use it like this:

```ts
import Client from '@axiomhq/axiom-node';

// Construct a client from environment variables
// Export an API token in `AXIOM_TOKEN` for this to work
const client = new Client();

// Ingest two events
await client.datasets.ingestEvents('my-application', [
  { 'method': 'GET', path: '/' },
  { 'method': 'POST', path: '/login' }
]);

// Query the dataset
const res = await client.datasets.aplQuery(`['my-application'] | summarize count() by bin_auto(_time)`);
const count = res.buckets.totals![0].aggregations![0].value;
console.log(`We have a count of ${count}`);
```

For more sample code snippets, head over to the [examples](examples) directory.

## Advanced configuration

The quickstart example above creates a client by environment variables, here's 
all that are supported.

| Environment variable | Description                                                                              |
|----------------------|------------------------------------------------------------------------------------------|
| `AXIOM_TOKEN`        | An Axiom API or personal token. If it's a personal token you'll also need `AXIOM_ORG_ID` |
| `AXIOM_ORG_ID`       | Your Axiom org id, necessary for personal tokens                                         |
| `AXIOM_URL`          | If you self-host Axiom, set this to your deployment url                                  |

You can programmatically override these by passing an options object to the 
`Client` constructor, here's an example with all values set:

```ts
const client = new Client({
  token: "xaat-xxxx",
  orgId: "my-org",
  url: "http://my-axiom.example.org"
});
```

## Contributing

The main aim of this repository is to continue developing and advancing
axiom-node, making it faster and simpler to use. Kindly check our
[contributing guide](https://github.com/axiomhq/axiom-node/blob/main/Contributing.md)
on how to propose bugfixes and improvements, and submitting pull requests to the
project

## License

&copy; Axiom, Inc., 2021

Distributed under MIT License (`The MIT License`).

See [LICENSE](LICENSE) for more information.

<!-- Badges -->

[workflow]: https://github.com/axiomhq/axiom-node/actions/workflows/push.yml
[workflow_badge]: https://img.shields.io/github/workflow/status/axiomhq/axiom-node/CI?style=flat-square&ghcache=unused
[release]: https://github.com/axiomhq/axiom-node/releases/latest
[release_badge]: https://img.shields.io/github/release/axiomhq/axiom-node.svg?style=flat-square&ghcache=unused
[license]: https://opensource.org/licenses/MIT
[license_badge]: https://img.shields.io/github/license/axiomhq/axiom-node.svg?color=blue&style=flat-square&ghcache=unused
