# Migrating `@axiomhq/js` from v2 to v3

Version 3 aligns the SDK's management services with Axiom's public OpenAPI document. It also gives the two client
classes more explicit names and raises the minimum supported Node.js version.

Ingestion and query behavior is unchanged. Most applications can migrate by updating their Node.js runtime, renaming
the client import, and resolving the stricter management API types reported by TypeScript.

## 1. Upgrade Node.js

`@axiomhq/js` v3 requires Node.js 22 or later. Update local development environments, CI matrices, and container base
images before upgrading the package.

For example:

```dockerfile
# Before
FROM node:20

# After
FROM node:22
```

## 2. Upgrade the package

```sh
npm install @axiomhq/js@^3
```

Use the equivalent command for pnpm, Yarn, or Bun when appropriate.

## 3. Rename the client classes

The old class names are removed rather than kept as deprecated aliases.

| v2 | v3 |
| --- | --- |
| `Axiom` | `AxiomClient` |
| `AxiomWithoutBatching` | `AxiomClientWithoutBatching` |

For the default batching client:

```ts
// Before
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN! });
```

```ts
// After
import { AxiomClient } from '@axiomhq/js';

const axiom = new AxiomClient({ token: process.env.AXIOM_TOKEN! });
```

For the client that sends every ingest request immediately:

```ts
// Before
import { AxiomWithoutBatching } from '@axiomhq/js';

const axiom = new AxiomWithoutBatching({ token: process.env.AXIOM_TOKEN! });
```

```ts
// After
import { AxiomClientWithoutBatching } from '@axiomhq/js';

const axiom = new AxiomClientWithoutBatching({ token: process.env.AXIOM_TOKEN! });
```

CommonJS consumers must rename the destructured export as well:

```js
const { AxiomClient } = require('@axiomhq/js');
```

Client options, ingestion, flushing, APL queries, and MPL queries otherwise keep the same API.

## 4. Adopt the OpenAPI management types

Management service types remain available through their existing namespaces, such as `datasets.CreateRequest` and
`monitors.Monitor`. Their definitions now come from the public OpenAPI document instead of permissive handwritten
interfaces.

Continue importing types from the package root:

```ts
import { AxiomClient, type datasets, type monitors } from '@axiomhq/js';

const dataset: datasets.CreateRequest = { name: 'production-logs' };
const monitor: monitors.CreateRequest = {
  name: 'Error rate',
  type: 'Threshold',
  aplQuery: "['production-logs'] | where level == \"error\" | count",
  operator: 'Above',
  threshold: 10,
  notifierIds: [],
};

const axiom = new AxiomClient({ token: process.env.AXIOM_TOKEN! });
await axiom.datasets.create(dataset);
await axiom.monitors.create(monitor);
```

Do not import files from `src/generated/v2` directly. Those files are implementation details; the service namespaces are
the supported public interface.

### Notable model changes

The compiler will identify all affected call sites. The most common changes are:

- `monitors.notifierIDs` is removed. Use `notifierIds`.
- `datasets.CreateRequest.edgeDeployment` accepts a string, but not `null`. Omit the property when no deployment is
  selected.
- `datasets.Dataset.edgeDeployment` and `datasets.Dataset.mapFields` are no longer nullable. They may still be absent.
- `datasets.Dataset.region` is removed, and `updatedAt` is required on returned datasets.
- `users.User.email` and `users.User.role` are required. The legacy `emails` array and nullable role are removed.
- `savedQueries.SavedQuery.metadata` is now `Record<string, string>` instead of `Record<string, unknown>`.
- Dashboard documents are now fully typed instead of `Record<string, unknown>`.
- Dataset, dashboard, and monitor responses now include required `labelIds` and optional resolved `labels`. Their list
  and get methods accept the generated label filtering options where supported.
- Open-ended index signatures were removed from management models. Undocumented extra properties are therefore rejected
  by TypeScript.

Examples:

```ts
// Before
await axiom.monitors.create({
  // ...
  notifierIDs: ['notifier-id'],
});

// After
await axiom.monitors.create({
  // ...
  notifierIds: ['notifier-id'],
});
```

```ts
// Before
const request: datasets.CreateRequest = {
  name: 'production-logs',
  edgeDeployment: null,
};

// After
const request: datasets.CreateRequest = {
  name: 'production-logs',
};
```

```ts
// Before
const email = user.email ?? user.emails?.[0];

// After
const email = user.email;
```

## 5. Handle the new delete and trim return values

Dataset delete and trim operations are asynchronous and now return the generated job response instead of a raw
`Response`. Request failures still reject with an error, so checking the HTTP status is no longer necessary.

```ts
// Before
const response = await axiom.datasets.delete('old-dataset');
if (!response.ok) {
  throw new Error(`Delete failed: ${response.status}`);
}
```

```ts
// After
const { jobID } = await axiom.datasets.delete('old-dataset');
```

Other management delete methods, such as `annotations.delete` and `monitors.delete`, now resolve to `void` rather than a
raw `Response`:

```ts
await axiom.monitors.delete('monitor-id');
```

The exported `datasets.TrimResult` type is also removed. Use `datasets.Job` when wrapping either operation:

```ts
async function trimDataset(name: string): Promise<datasets.Job> {
  return axiom.datasets.trim(name, '720h');
}
```

## 6. Use the expanded management API where needed

All management services are mounted on both client classes.

| Service | Common operations |
| --- | --- |
| `annotations` | `list`, `get`, `create`, `update`, `delete` |
| `dashboards` | `list`, `get`, `create`, `update`, `delete`, `patchChart` |
| `datasets` | Dataset, field, map-field, trim, vacuum, and metrics metadata operations |
| `groups` | `list`, `get`, `create`, `update`, `delete` |
| `monitors` | `list`, `get`, `create`, `update`, `delete`, `history` |
| `notifiers` | `list`, `get`, `create`, `update`, `delete` |
| `orgs` | `list`, `get`, `create`, `update` |
| `roles` | `list`, `get`, `create`, `update`, `delete` |
| `savedQueries` | `list`, `get`, `create`, `update`, `delete` |
| `tokens` | `list`, `get`, `create`, `delete`, `regenerate` |
| `users` | `current`, `updateCurrent`, `list`, `create`, `get`, `remove`, `updateRole` |
| `virtualFields` | `list`, `get`, `create`, `update`, `delete` |
| `views` | `list`, `get`, `create`, `update`, `delete` |

Newly exposed resources use the same authenticated client configuration:

```ts
const tokens = await axiom.tokens.list();
const groups = await axiom.groups.list();
const views = await axiom.views.list();
```

## Migration checklist

- Run the application and CI on Node.js 22 or 24.
- Rename `Axiom` and `AxiomWithoutBatching` imports and constructor calls.
- Run `tsc --noEmit` and update management request and response handling.
- Replace `notifierIDs` with `notifierIds`.
- Replace checks of raw `Response` values from dataset delete or trim calls with the returned job ID. Other management
  delete calls no longer return a response value.
- Run the application's tests, especially code that renders dataset, user, dashboard, monitor, or saved-query data.
