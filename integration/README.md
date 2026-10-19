# Axiom integration tests for JS SDK

## Quickstart

Run the tests using `pnpm integration`.

The tests create datasets whose names include `AXIOM_DATASET_SUFFIX`. The
suffix defaults to `local`; set it to a pipeline ID or commit hash when
running against a shared organization:

```shell
export AXIOM_DATASET_SUFFIX="local"
pnpm integration
```

## CI configuration

The CI workflow uses the claimed Agent Org `axiom-js-ci-hvdu` at
`https://api.axiom.co`. Configure the repository's testing environment with
these settings:

| GitHub setting | Type | Runtime variable | Purpose |
| --- | --- | --- | --- |
| `TESTING_API_TOKEN` | Secret | `AXIOM_TOKEN` | API token for the integration tests |
| `TESTING_INGEST_API_TOKEN` | Secret | `NEXT_PUBLIC_AXIOM_TOKEN` | Ingest token used by the E2E app |
| `TESTING_API_URL` | Variable | `AXIOM_URL`, `NEXT_PUBLIC_AXIOM_URL` | API endpoint (`https://api.axiom.co`) |
| `TESTING_ORG_ID` | Variable | `AXIOM_ORG_ID`, `NEXT_PUBLIC_AXIOM_ORG_ID` | Agent Org (`axiom-js-ci-hvdu`) |
| `TESTING_ENVIRONMENT` | Variable | `TESTING_ENVIRONMENT` | Environment namespace included in CI dataset names |
| `TESTING_EDGE` | Variable, optional | `AXIOM_EDGE` | Edge deployment selector |
| `TESTING_EDGE_URL` | Variable | `AXIOM_EDGE_URL` | Edge ingestion endpoint (`https://us-east-1.aws.edge.axiom.co`) |
| `TESTING_EDGE_DATASET_REGION` | Variable | `AXIOM_EDGE_DATASET_REGION` | Dataset edge region (`cloud.us-east-1.aws`) |

If an Agent Org was initially created as temporary, claim it and make it
permanent before using it for CI. Repository managers can inspect the GitHub
variables and replace the secrets, but GitHub does not reveal saved secret
values.

## Access and replacement

Treat these test organizations as disposable. Prefer provisioning a new Agent
Org and updating the GitHub testing configuration over recovering access to
an existing org. If you need access to the current org, contact `cje`.
