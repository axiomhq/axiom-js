This changes the default APL query response format in `@axiomhq/js` from `legacy` to `tabular`, which aligns the SDK with the platform direction and removes one of the major legacy-format traffic sources identified in the rollout analysis.

Slack context: <https://watchlyhq.slack.com/archives/C0ABV843Y9M/p1773440506177029|#gilfoyle-sessions thread>

Explicit `format: 'legacy'` requests continue to work, and the unit tests now assert that queries without a format default to tabular.

Validation: `corepack pnpm --filter @axiomhq/js test`
