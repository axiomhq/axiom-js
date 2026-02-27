# axiom-js

[![Workflow][workflow_badge]][workflow]
[![License][license_badge]][license]

This is a monorepo consisting of the following projects:

* [`@axiomhq/js`](./packages/js): Official API bindings that let you ingest or query your data.
* [`@axiomhq/winston`](./packages/winston): A [winston](https://github.com/winstonjs/winston) transport which sends logs to Axiom.
* [`@axiomhq/pino`](./packages/pino): A [pino](https://github.com/pinojs/pino) transport which sends logs to Axiom.
* [`@axiomhq/tanstack-start`](./packages/tanstack-start): Observability utilities for TanStack Router (SPA) and TanStack Start.

## Requirements

Node.js 20 or higher is required. Node.js 18 is no longer supported.

## License

Distributed under the [MIT License](LICENSE).

<!-- Badges -->

[workflow]: https://github.com/axiomhq/axiom-js/actions/workflows/ci.yml
[workflow_badge]: https://img.shields.io/github/actions/workflow/status/axiomhq/axiom-js/ci.yml?branch=main&ghcache=unused
[license]: https://opensource.org/licenses/MIT
[license_badge]: https://img.shields.io/github/license/axiomhq/axiom-js.svg?color=blue&ghcache=unused
