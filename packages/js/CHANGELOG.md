# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
