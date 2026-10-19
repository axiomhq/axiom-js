# Axiom E2E app for JS SDK

## Quickstart

Run the tests using `pnpm e2e` from the repository root after building the
packages and deploying this app.

The test runner and the deployed app must use the same
`AXIOM_DATASET_SUFFIX`. The suffix defaults to `local`; CI supplies a run
specific suffix to both the test runner and the preview deployment.

## Vercel configuration

The CI workflow passes server variables to the Vercel preview deployment at
runtime, and passes the public variables and dataset suffix at build time. It
also supplies the public variables and suffix at runtime where the app needs
them. It does not mutate the Vercel project settings. Local or manually
triggered deployments must provide the same values, including the same
run-specific `AXIOM_DATASET_SUFFIX` as the test runner. The full API token is
kept server-side and is never passed as a build-time variable:

| Vercel variable | Type | Used by |
| --- | --- | --- |
| `AXIOM_TOKEN` | Secret | Server-side lambda and edge routes |
| `AXIOM_URL` | Variable | Server-side lambda and edge routes |
| `AXIOM_ORG_ID` | Variable | Server-side lambda and edge routes |
| `NEXT_PUBLIC_AXIOM_TOKEN` | Secret | Browser and React Server Components |
| `NEXT_PUBLIC_AXIOM_URL` | Variable | Browser and React Server Components |
| `NEXT_PUBLIC_AXIOM_ORG_ID` | Variable | Browser and React Server Components |
| `AXIOM_DATASET_SUFFIX` | Variable | Dataset name used by the deployed app |

The `NEXT_PUBLIC_AXIOM_TOKEN` must be ingest-only because Next.js includes it
in browser assets.

Use the claimed Agent Org `axiom-js-ci-hvdu` and `https://api.axiom.co` for
the shared CI configuration. If an Agent Org was initially created as
temporary, claim it before using it for E2E so it does not expire after
24 hours. Repository managers can inspect the GitHub variables and replace
the secrets, but GitHub does not reveal saved secret values.

## Access and replacement

Treat these test organizations as disposable. Prefer provisioning a new Agent
Org and updating the GitHub testing configuration over recovering access to
an existing org. If you need access to the current org, contact `cje`.
