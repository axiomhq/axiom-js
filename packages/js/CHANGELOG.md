# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0](https://github.com/axiomhq/axiom-js/compare/js-1.6.1...js-1.7.0) (2026-06-09)


### Features

* **dashboards:** read only operations ([#457](https://github.com/axiomhq/axiom-js/issues/457)) ([83ec382](https://github.com/axiomhq/axiom-js/commit/83ec3820f493383f3c26b143c77d4408ba961b89))
* **datasets:** migrate to datasets v2 + add metrics support ([#455](https://github.com/axiomhq/axiom-js/issues/455)) ([0688f37](https://github.com/axiomhq/axiom-js/commit/0688f375a49f380dad05640572d0c61e294d5e4b))
* **query:** add mpl support ([#453](https://github.com/axiomhq/axiom-js/issues/453)) ([c3938af](https://github.com/axiomhq/axiom-js/commit/c3938afc9df072f6d985fb9205ce3bdbb06138b4))
* **saved queries:** read only operations ([#456](https://github.com/axiomhq/axiom-js/issues/456)) ([3adf678](https://github.com/axiomhq/axiom-js/commit/3adf6783b342c58d2c1b8bf77cc1ab98cc980071))
* **users:** read only operations ([#458](https://github.com/axiomhq/axiom-js/issues/458)) ([64f7d62](https://github.com/axiomhq/axiom-js/commit/64f7d62c900287c1d4dbf292ad2a50f8756786ea))

## [1.6.1](https://github.com/axiomhq/axiom-js/compare/js-1.6.0...js-1.6.1) (2026-05-06)


### Bug Fixes

* **js:** overall batching logic ([#419](https://github.com/axiomhq/axiom-js/issues/419)) ([a2b3f17](https://github.com/axiomhq/axiom-js/commit/a2b3f172f12494706f4ecfff476e23db0b6be069))

## [1.6.0](https://github.com/axiomhq/axiom-js/compare/js-1.5.0...js-1.6.0) (2026-03-30)


### Features

* **js:** gzip-compress default ingest payloads ([#413](https://github.com/axiomhq/axiom-js/issues/413)) ([3e76027](https://github.com/axiomhq/axiom-js/commit/3e7602781742b2fd8374701e90180e8d585068f2))

## [1.5.0](https://github.com/axiomhq/axiom-js/compare/js-1.4.0...js-1.5.0) (2026-03-20)


### Features

* edge deployment in favor of region ([#405](https://github.com/axiomhq/axiom-js/issues/405)) ([0edc449](https://github.com/axiomhq/axiom-js/commit/0edc44998cd3c16d5c33af71defa6101ffb8008e))


### Bug Fixes

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
