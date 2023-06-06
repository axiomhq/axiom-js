![axiom-js: The official javascript bindings for the Axiom API](.github/images/banner-dark.svg#gh-dark-mode-only)
![axiom-js: The official javascript bindings for the Axiom API](.github/images/banner-light.svg#gh-light-mode-only)

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

## Projects

This is a monorepo, for specific documentation, check out the different projects:

* [`@axiomhq/js`](./packages/js): Official API bindings that let you ingest or query your data.
* [`@axiomhq/winston`](./packages/winston): A [winston](https://github.com/winstonjs/winston) transport which sends logs to Axiom.

## License

Distributed under the [MIT License](LICENSE).

<!-- Badges -->

[workflow]: https://github.com/axiomhq/axiom-js/actions/workflows/ci.yml
[workflow_badge]: https://img.shields.io/github/actions/workflow/status/axiomhq/axiom-js/ci.yml?branch=main&ghcache=unused
[release]: https://github.com/axiomhq/axiom-js/releases/latest
[release_badge]: https://img.shields.io/github/release/axiomhq/axiom-js.svg?ghcache=unused
[license]: https://opensource.org/licenses/MIT
[license_badge]: https://img.shields.io/github/license/axiomhq/axiom-js.svg?color=blue&ghcache=unused
