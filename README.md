# Axiom Node

---

## Table of Contents

- [Axiom Node](#axiom-node)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Authentication](#authentication)
  - [Usage](#usage)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [License](#license)

## Introduction

Axiom Node is a NodeJS package for accessing the [Axiom](https://www.axiom.co/)
API.

## Installation 

```
$ git clone https://github.com/axiomhq/axiom-node
$ cd axiom-node

```

## Authentication

The Client is initialized with the url of the deployment and an access token. The access token can be a personal token retrieved from the users profile page or an ingest token retrieved from the settings of the Axiom deployment.

The personal access token grants access to all resources available to the user on his behalf.

The ingest token just allows ingestion into the datasets the token is configured for.


## Usage

You need to at least provide the URL of your deployment and a valid personal 
access or ingest token.

```ts
import Client from '../lib/client';

const depylomentURL = process.env.AXM_DEPLOYMENT_URL || '';
const accessToken = process.env.AXM_ACCESS_TOKEN || '';

const client = new Client(depylomentURL, accessToken);

// ...
```

For more sample code snippets, head over to the [examples](examples) directory.

## Documentation

You can find the Axiom and Axiom node documentation [on the docs website.](https://docs.axiom.co/)

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

The main aim of this repository is to continue developing and advancing Axiom Node, making it faster and more simplified to use. Kindly check our [contributing guide](https://github.com/axiomhq/axiom-node/blob/main/Contributing.md) on how to propose bugfixes and improvements, and submitting pull requests to the project

## License

&copy; Axiom, Inc., 2021

Distributed under MIT License (`The MIT License`).

See [LICENSE](LICENSE) for more information.
