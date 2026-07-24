# Examples

## Usage

```shell
export AXIOM_TOKEN="..."
npx ts-node <example-file.ts>
```

## Examples

<!-- examples in src/*.ts, excluding local smoke tests -->

- [create-annotation.ts](./src/create-annotation.ts): How to create an annotation.

- [ingest-events.ts](./src/ingest-events.ts): How to ingest events into a dataset.

- [ingest-file.ts](./src/ingest-file.ts): How to ingest the contents of a file into Axiom.

- [ingest-string.ts](./src/ingest-string.ts): How to ingest a JSON string into a dataset.

- [inspect-dashboards.ts](./src/inspect-dashboards.ts): How to list dashboards and retrieve one by UID.

- [inspect-dataset.ts](./src/inspect-dataset.ts): How to inspect a dataset, fields, and map fields.

- [inspect-metrics-dataset.ts](./src/inspect-metrics-dataset.ts): How to inspect metrics metadata for a metrics dataset.

- [list-datasets.ts](./src/list-datasets.ts): How to retrieve a list of datasets.

- [manage-monitors.ts](./src/manage-monitors.ts): How to create, list, get, update, and delete monitors.

- [query-legacy.ts](./src/query-legacy.ts): How to query a dataset.

- [query-metrics.ts](./src/query-metrics.ts): How to query metrics using MPL.

- [query.ts](./src/query.ts): How to query summarized results using the Axiom Processing Language (APL).

- [saved-queries.ts](./src/saved-queries.ts): How to retrieve saved queries.

- [users.ts](./src/users.ts): How to retrieve the current user, list users, and retrieve a user by ID.
