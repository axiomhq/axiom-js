# OpenAPI generation

The v2 management API operations and models in `src/generated/v2` are generated with Orval.

Run the generator from the repository root:

```sh
pnpm generate:openapi
```

Generation uses Orval 8 and requires Node.js 22.18 or newer. This is only a development-time requirement; the generated
client and published SDK continue to support the Node.js versions declared by the package.

The preparation script downloads the public Axiom v2 OpenAPI document at the pinned documentation commit in
`scripts/prepare-openapi.mjs`, normalizes schemas that Orval cannot currently emit as valid TypeScript, and writes the
temporary document to `openapi/.cache`. Generated files are committed, while the downloaded document is ignored.

Do not expose generated operations directly from the package entry point. Public services wrap them to preserve the
SDK API and route requests through `openapiRequest`, which reuses the authenticated SDK transport.
