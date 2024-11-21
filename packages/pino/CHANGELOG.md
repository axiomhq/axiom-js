# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2024-11-20

- Update @axiomhq/js to v1.3.0

## [1.2.0] - 2024-09-23

- Update @axiomhq/js to v1.2.0

## [1.1.0] - 2024-07-12

- Update @axiomhq/js to v1.1.0

## [1.0.0] - 2024-06-12

- Update @axiomhq/js to v1.0.0

## [1.0.0-rc.4] - 2024-06-10

### Changed
- Update @axiomhq/js to version 1.0.0-rc.4

### Fixed

- fix: add BigInt support to JSON.stringify [#189] from lucassmuller/fix/json-stringify

### Changed
- Update @axiomhq/js to version 1.0.0-rc.3

## [1.0.0-rc.3] - 2024-03-20

### Fixed
- Fix fetch request init with retry in @axiomhq/js


### Changed
- Update @axiomhq/js to version 1.0.0-rc.3

## [1.0.0-rc.2] - 2024-02-09

### Changed
- Update @axiomhq/js to version 1.0.0-rc.2

## [1.0.0-rc.1] - 2023-09-27

### Breaking Change

- Axiom token is now required as a parameter of the constructor, automatic detection of environment variables is now removed.

## Fixed

- switched the build process to use rollup in order to solves the module resolution issue.

## [0.1.2] - 2023-06-26

### Fixed

- Add types to package.json exports ([#29](https://github.com/axiomhq/axiom-js/pull/29))
- Fake process.env for browsers ([#26](https://github.com/axiomhq/axiom-js/pull/26))

## [0.1.1] - 2023-06-20

### Fixed

- Fix dependency on unreleased version of `@axiomhq/js`

## [0.1.0] - 2023-06-19

Initial release

[unreleased]: https://github.com/axiomhq/axiom-js/compare/pino-0.1.2...HEAD
[0.1.2]: https://github.com/axiomhq/axiom-js/releases/tag/pino-0.1.2
[0.1.1]: https://github.com/axiomhq/axiom-js/releases/tag/pino-0.1.1
[0.1.0]: https://github.com/axiomhq/axiom-js/releases/tag/pino-0.1.0
