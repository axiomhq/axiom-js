# OpenAPI generation

The v2 management API operations and models in `src/generated/v2` are generated with Orval.

Run the generator from the repository root:

```sh
pnpm generate:openapi
```

Generation uses Orval 8 and requires Node.js 22.18 or newer. This is only a development-time requirement; the generated
client and published SDK continue to support the Node.js versions declared by the package.

The source document is committed at `openapi/v2.json`. The preparation script normalizes schemas that Orval cannot
currently emit as valid TypeScript and writes the temporary document to `openapi/.cache`. Set
`AXIOM_OPENAPI_V2_URL` to generate from a remote document instead. The source document and generated files are
committed, while the normalized cache is ignored.

Do not expose generated operations directly from the package entry point. Public services wrap them to preserve the
SDK API and route requests through `openapiRequest`, which reuses the authenticated SDK transport.
