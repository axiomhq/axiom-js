# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
