# Axiom Node

---

## Table of Contents

1. [Introduction](#introduction)
1. [Usage](#usage)
1. [License](#license)

## Introduction

Axiom Node is a NodeJS package for accessing the [Axiom](https://www.axiom.co/)
API.

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

## License

&copy; Axiom, Inc., 2021

Distributed under MIT License (`The MIT License`).

See [LICENSE](LICENSE) for more information.
