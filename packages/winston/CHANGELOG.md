# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0](https://github.com/axiomhq/axiom-js/compare/winston-1.3.1...winston-1.4.0) (2026-02-24)


### Features

* add support for edge endpoints ([#389](https://github.com/axiomhq/axiom-js/issues/389)) ([1902498](https://github.com/axiomhq/axiom-js/commit/190249815787d14478725fa89a4addea8ba1a44b))
* **winston:** expose onError method and pass it down to Axiom client ([1fbaab3](https://github.com/axiomhq/axiom-js/commit/1fbaab3d764dde26267d2826edcfd9ea0b476e6b))
* **winston:** expose onError method and pass it down to Axiom client ([585c3a9](https://github.com/axiomhq/axiom-js/commit/585c3a951d69a320504d6c1e0ef569af9b2d8ca8))


### Bug Fixes

* provide onError to catch errors on fetch promises ([a03e698](https://github.com/axiomhq/axiom-js/commit/a03e698d9b549175cce1c252a9cd0150bc9b134f))
* remove prepublish scripts from winston and pino packages ([#396](https://github.com/axiomhq/axiom-js/issues/396)) ([77bbada](https://github.com/axiomhq/axiom-js/commit/77bbada6cff05359caaebe0d5dc714ba7c6469fb))
* set cache to no-store instead of no-cache ([a386427](https://github.com/axiomhq/axiom-js/commit/a386427ae3e080717f9e143169874deaaf95118d))
* set cache to no-store instead of no-cache ([8e2232d](https://github.com/axiomhq/axiom-js/commit/8e2232db35d8799c34d0c39599aacfaebb23f85f))

## [Unreleased]

## [1.3.0] - 2024-11-20

- Update @axiomhq/js to v1.3.0

## [1.2.0] - 2024-09-23

- fix: Make flush() public
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
- reorder the export object of winston package.json

## [0.1.2] - 2023-06-26

### Fixed

- Add types to package.json exports ([#29](https://github.com/axiomhq/axiom-js/pull/29))
- Fake process.env for browsers ([#26](https://github.com/axiomhq/axiom-js/pull/26))

## [0.1.1] - 2023-06-20

### Fixed

- Updated @axiomhq/js dependency

## [0.1.0] - 2023-06-14

Initial release

[unreleased]: https://github.com/axiomhq/axiom-js/compare/winston-0.1.2...HEAD
[0.1.2]: https://github.com/axiomhq/axiom-js/releases/tag/winston-0.1.2
[0.1.1]: https://github.com/axiomhq/axiom-js/releases/tag/winston-0.1.1
[0.1.0]: https://github.com/axiomhq/axiom-js/releases/tag/winston-0.1.0
