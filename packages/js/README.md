![axiom-js: The official javascript bindings for the Axiom API](../../.github/images/banner-dark.svg#gh-dark-mode-only)
![axiom-js: The official javascript bindings for the Axiom API](../../.github/images/banner-light.svg#gh-light-mode-only)

<div align="center">

[![Workflow][workflow_badge]][workflow]
[![Latest Release][release_badge]][release]
[![License][license_badge]][license]

</div>

[Axiom](https://axiom.co) unlocks observability at any scale.

- **Ingest with ease, store without limits:** Axiom’s next-generation datastore enables ingesting petabytes of data with ultimate efficiency. Ship logs from Kubernetes, AWS, Azure, Google Cloud, DigitalOcean, Nomad, and others.
- **Query everything, all the time:** Whether DevOps, SecOps, or EverythingOps, query all your data no matter its age. No provisioning, no moving data from cold/archive to “hot”, and no worrying about slow queries. All your data, all. the. time.
- **Powerful dashboards, for continuous observability:** Build dashboards to collect related queries and present information that’s quick and easy to digest for you and your team. Dashboards can be kept private or shared with others, and are the perfect way to bring together data from different sources

For more information check out the [official documentation](https://axiom.co/docs)
and our
[community Discord](https://axiom.co/discord).

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

:warning: Support of Edge runtime is still experimental and unstable.
 the Edge runtime doesn't support `Stream` module, so that client methods
 that depend on Stream won't work on edge, like `ingestStream, ingestEvents and ingestBuffer`.

For further examples, head over to the [examples](../../examples) directory.

## License

Distributed under the [MIT License](LICENSE).

<!-- Badges -->

[workflow]: https://github.com/axiomhq/axiom-js/actions/workflows/ci.yml
[workflow_badge]: https://img.shields.io/github/actions/workflow/status/axiomhq/axiom-js/ci.yml?branch=main&ghcache=unused
[release]: https://github.com/axiomhq/axiom-js/releases/latest
[release_badge]: https://img.shields.io/github/release/axiomhq/axiom-js.svg?ghcache=unused
[license]: https://opensource.org/licenses/MIT
[license_badge]: https://img.shields.io/github/license/axiomhq/axiom-js.svg?color=blue&ghcache=unused
