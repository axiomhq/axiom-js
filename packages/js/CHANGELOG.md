# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0](https://github.com/axiomhq/axiom-js/compare/js-1.3.1...js-1.4.0) (2026-02-24)


### Features

* add js bindings to /v2/monitors ([aa49c64](https://github.com/axiomhq/axiom-js/commit/aa49c64bf5b66a579b141be694698cb0a64f0c7f))
* add support for edge endpoints ([#389](https://github.com/axiomhq/axiom-js/issues/389)) ([1902498](https://github.com/axiomhq/axiom-js/commit/190249815787d14478725fa89a4addea8ba1a44b))


### Bug Fixes

* Forbidden to lowercase f ([#385](https://github.com/axiomhq/axiom-js/issues/385)) ([b7166ff](https://github.com/axiomhq/axiom-js/commit/b7166ff9aa54d81817ef3f8ab574b0de4430b376)), closes [#288](https://github.com/axiomhq/axiom-js/issues/288)
* remove prepublish scripts from winston and pino packages ([#396](https://github.com/axiomhq/axiom-js/issues/396)) ([77bbada](https://github.com/axiomhq/axiom-js/commit/77bbada6cff05359caaebe0d5dc714ba7c6469fb))

## [Unreleased]

## [1.3.0] - 2024-09-20

## Added

- feat: Added timeouts to Axiom client [#236](https://github.com/axiomhq/axiom-js/pull/236)

## [1.2.0] - 2024-09-23

## Added

- feat: Added support for quert tabular result format

## [1.1.0] - 2024-08-15

## Security

- Warning against usage of personal tokens

## [1.1.0] - 2024-07-12

## Added

- feate: Add referrer opt to dataset creation


## [1.0.0] - 2024-06-12

## Added

- Added support for Annotations API

## Migrate to v1.x

- Pass the credentials as an object to Axiom client, this package no longer reads them from the environment variables.
  do:
  ```ts
    const axiom = new Axiom({
      token: process.env.AXIOM_TOKEN,
    });
  ```
  instead of:
  ```ts
  const axiom = new Axiom();
  ```

## [1.0.0-rc.4] - 2024-06-10

### Fixed

- fix: add BigInt support to JSON.stringify [#189] from lucassmuller/fix/json-stringify

## [1.0.0-rc.3] - 2024-03-20

### Fixed

- Fix fetch request init with retry

## [1.0.0-rc.2] - 2024-02-09

## [1.0.0-rc.1] - 2023-09-27

### Breaking Change

- Axiom token is now required as a parameter of the constructor, automatic detection of environment variables is now removed.

## Fixed

- switched the build process to use rollup in order to solves the module resolution issue.

## [0.1.2] - 2023-06-26

### Fixed

- Add types to package.json exports ([#29](https://github.com/axiomhq/axiom-js/pull/29))
- Fix wrong reference for flush example ([#27](https://github.com/axiomhq/axiom-js/pull/27))
- Fake process.env for browsers ([#26](https://github.com/axiomhq/axiom-js/pull/26))

## [0.1.1] - 2023-06-20

### Added

- Export ClientOptions in client ([#17](https://github.com/axiomhq/axiom-js/pull/17))

### Fixed

- Add flush comment to README.md ([#9)](https://github.com/axiomhq/axiom-js/pull/9))

### Changed

- Rename Client => Axiom ([#17](https://github.com/axiomhq/axiom-js/pull/17))

## [0.1.0] - 2023-06-14

Initial release

[unreleased]: https://github.com/axiomhq/axiom-js/compare/js-0.1.2...HEAD
[0.1.2]: https://github.com/axiomhq/axiom-js/releases/tag/js-0.1.2
[0.1.1]: https://github.com/axiomhq/axiom-js/releases/tag/js-0.1.1
[0.1.0]: https://github.com/axiomhq/axiom-js/releases/tag/js-0.1.0
