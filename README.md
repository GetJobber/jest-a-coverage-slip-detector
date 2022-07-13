# `@jobber/jest-a-coverage-slip-detector`

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/%40shopify%2Fjest-a-coverage-slip-detector.svg)](https://badge.fury.io/js/%40jobber%2Fjest-a-coverage-slip-detector)

This library ensures that new files have [Jest](https://jestjs.io/) coverage meeting the configured goals.

Additionally, this library can be added to an existing project such that legacy files not meeting the coverage goals are added to an exception list where they raise an error if coverage slips, and ratchet upwards as progress is made improving them, all while enforcing the higher coverage goals on net new code.

## Requirements

- Jest

## Installation

`npm install --save-dev @jobber/jest-a-coverage-slip-detector`

## Configure Jest

Within `jest.config.js`:
1. Ensure Jest is configured to include `json-summary` in `coverageReporters`.
1. Ensure that coverage collection is enabled, either with the `--coverage` parameter, or by configuring `collectCoverage` to `true`.
1. Either remove the `coverageThreshold` configuration from Jest, or set it to: `coverageThreshold: { global: {} }`

Example:
```js
module.exports = {
  coverageReporters: [
    'json-summary' // plus any other reporters, e.g. "lcov", "text", "text-summary"
  ],
  collectCoverage: true,
  coverageThreshold: { global: {} }
}
```

## Configure Scripts

Within `package.json`:
```js
{
  "scripts": {
    "test": "jest --coverage", // or set `collectCoverage` to `true` in Jest config
    "posttest": "jest-a-coverage-slip-detector",
    "jest:updateCoverageExceptions": "jest-a-coverage-slip-detector --update",
    "jest:updateCoverageExceptionsForce": "jest-a-coverage-slip-detector --force-update"
  }
}
```

## Configure Coverage Goals

If you're happy with the defaults below, nothing further is needed:
```js
{
  "coverageGoal": { "lines": 80, "functions": 80, "statements": 80, "branches": 80 }
}
```

Otherwise:
- Create a `.jest-a-coverage-slip-detector` directory in the root of your project
- Create a `config.json` file within the `.jest-a-coverage-slip-detector` directory

Example:
```js
{
  "coverageGoal": { "lines": 90, "functions": 90, "statements": 90, "branches": 90 }
}
```

## Usage

### First Run

1. Generate and view coverage errors: `npm run test`
1. Record current coverage errors as legacy exceptions: `npm run jest:updateCoverageExceptionsForce`
1. Commit the generated exception listing (`generatedCoverageExceptions.json` by default) to source control

### Going Forward

- Run `npm run test` as normal (locally or in CI), any slips in test coverage will fail out the command. Note that this will happen for either legacy files not meeting their recorded targets, or in new files not meeting the configured goals.
- As improvements to test coverage are made to legacy files, run `npm run jest:updateCoverageExceptions` to update the exception listing (and commit it) to "ratchet" up the coverage.


## CLI
```console
Usage: jest-a-coverage-slip-detector [options]

Options:
  --update               update exceptions with improved coverage levels
  --force-update         record current coverage errors as exceptions
```
