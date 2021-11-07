# Axiom Node

[![Workflow][workflow_badge]][workflow]
[![Latest Release][release_badge]][release]
[![License][license_badge]][license]

![Alt](https://repobeats.axiom.co/api/embed/40b1a942132e3f515d5374bde5e47fb0750eb411.svg "Repobeats analytics image")

---

## Table of Contents

1. [Introduction](#introduction)
1. [Installation](#installation)
1. [Authentication](#authentication)
1. [Usage](#usage)
1. [Documentation](#documentation)
1. [Contributing](#contributing)
1. [License](#license)

## Introduction

Axiom Node is a NodeJS package for accessing the [Axiom](https://www.axiom.co/)
API.

## Installation 

### Install using `npm`

```shell
npm i @axiomhq/axiom-node
```

### Install from source

```shell
git clone https://github.com/axiomhq/axiom-node
cd axiom-node
npm install
```

## Authentication

The client is initialized with the url of the deployment and an access token
when using Axiom Selfhost or an access token and the users organization id when
using Axiom Cloud.

The access token can be a personal token retrieved from the users profile page
or an ingest token retrieved from the settings of the Axiom deployment.

The personal access token grants access to all resources available to the user
on his behalf.

The ingest token just allows ingestion into the datasets the token is configured
for.

## Usage

```ts
// Export `AXIOM_TOKEN` and `AXIOM_ORG_ID` for Axiom Cloud
// Export `AXIOM_URL` and `AXIOM_TOKEN` for Axiom Selfhost

import Client from '@axiomhq/axiom-node';

const client = new Client();

// ...
```

For more sample code snippets, head over to the [examples](examples) directory.

## Documentation

You can find the Axiom and Axiom node documentation
[on the docs website.](https://docs.axiom.co/)

The documentation is divided into several sections:

- [Overview of Axiom](https://docs.axiom.co/usage/getting-started/)
- **Installing Axiom:**
  - [Axiom Cloud](https://docs.axiom.co/install/cloud/)
  - [Desktop Demo](https://docs.axiom.co/install/demo/)
  - [Runing Axiom on Kubernetes](https://docs.axiom.co/install/kubernetes/)
- [Axiom API](https://docs.axiom.co/reference/api/)
- [Axiom CLI](https://github.com/axiomhq/cli)
- [Getting Support](https://www.axiom.co/support/)
- [Data Shippers we support](https://docs.axiom.co/data-shippers/elastic-beats/)

## Contributing

The main aim of this repository is to continue developing and advancing Axiom
Node, making it faster and simpler to use. Kindly check our
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
