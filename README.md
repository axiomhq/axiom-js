# axiom-js

<a href="https://axiom.co">
<picture>
  <source media="(prefers-color-scheme: dark) and (min-width: 600px)" srcset="https://axiom.co/assets/github/axiom-github-banner-light-vertical.svg">
  <source media="(prefers-color-scheme: light) and (min-width: 600px)" srcset="https://axiom.co/assets/github/axiom-github-banner-dark-vertical.svg">
  <source media="(prefers-color-scheme: dark) and (max-width: 599px)" srcset="https://axiom.co/assets/github/axiom-github-banner-light-horizontal.svg">
  <img alt="Axiom.co banner" src="https://axiom.co/assets/github/axiom-github-banner-dark-horizontal.svg" align="right">
</picture>
</a>
&nbsp;

[![Workflow][workflow_badge]][workflow]
[![License][license_badge]][license]

[Axiom](https://axiom.co) unlocks observability at any scale.

- **Ingest with ease, store without limits:** Axiom’s next-generation datastore enables ingesting petabytes of data with ultimate efficiency. Ship logs from Kubernetes, AWS, Azure, Google Cloud, DigitalOcean, Nomad, and others.
- **Query everything, all the time:** Whether DevOps, SecOps, or EverythingOps, query all your data no matter its age. No provisioning, no moving data from cold/archive to “hot”, and no worrying about slow queries. All your data, all. the. time.
- **Powerful dashboards, for continuous observability:** Build dashboards to collect related queries and present information that’s quick and easy to digest for you and your team. Dashboards can be kept private or shared with others, and are the perfect way to bring together data from different sources

For more information check out the [official documentation](https://axiom.co/docs)
and our
[community Discord](https://axiom.co/discord).

## Projects

This is a monorepo consisting of the following projects:

* [`@axiomhq/js`](./packages/js): Official API bindings that let you ingest or query your data.
* [`@axiomhq/winston`](./packages/winston): A [winston](https://github.com/winstonjs/winston) transport which sends logs to Axiom.
* [`@axiomhq/pino`](./packages/pino): A [pino](https://github.com/pinojs/pino) transport which sends logs to Axiom.


## Migrate to v1.x

- Pass the credentials as an object to Axiom client, this package no longer reads them from the environment variables.
  do:
  ```ts
    const axiom = new Axiom({
      token: process.env.AXIOM_TOKEN,
    });
  ```
  instead of:
  ```ts
  const axiom = new Axiom();
  ```

## License

Distributed under the [MIT License](LICENSE).

<!-- Badges -->

[workflow]: https://github.com/axiomhq/axiom-js/actions/workflows/ci.yml
[workflow_badge]: https://img.shields.io/github/actions/workflow/status/axiomhq/axiom-js/ci.yml?branch=main&ghcache=unused
[license]: https://opensource.org/licenses/MIT
[license_badge]: https://img.shields.io/github/license/axiomhq/axiom-js.svg?color=blue&ghcache=unused
