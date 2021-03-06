# `@jobber/jest-a-coverage-slip-detector`

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/%40jobber%2Fjest-a-coverage-slip-detector.svg)](https://badge.fury.io/js/%40jobber%2Fjest-a-coverage-slip-detector)

This library ensures that new files have [Jest](https://jestjs.io/) coverage meeting the configured goals.

Additionally, this library can be added to an existing project such that legacy files not meeting the coverage goals are added to an exception list where they raise an error if coverage slips, and ratchet upwards as progress is made improving them, all while enforcing the higher coverage goals on net new code.

- supports JavaScript and TypeScript projects
- prevents coverage from slipping, even on legacy files
- detects coverage improvements and prints messaging to update snapshots
- CI friendly; updating snapshots is a separate explicit activity
- supports monitoring completely untested code through dynamic usage of `collectCoverageFrom`

## Requirements

- Jest

## Installation

`npm install --save-dev @jobber/jest-a-coverage-slip-detector`

## Configure Jest

Within `jest.config.js` or `jest.config.ts`:
1. Ensure Jest is configured to include `json-summary` in `coverageReporters`.
1. Ensure that coverage collection is enabled, either with the `--coverage` parameter, or by configuring `collectCoverage` to `true`.
1. Either remove the `coverageThreshold` configuration from Jest, or set it to: `coverageThreshold: { global: {} }`.
1. Wrap the configuration with the `withJestSlipDetection` utility method in order to dynamically leverage `collectCoverageFrom` set to the configured `coverageGlob`.

Example (JavaScript):

```js
const { withJestSlipDetection } = require("@jobber/jest-a-coverage-slip-detector");

module.exports = withJestSlipDetection({
  coverageReporters: [
    "json-summary" // plus any other reporters, e.g. "lcov", "text", "text-summary"
  ],
  collectCoverage: true,
  coverageThreshold: { global: {} },
});
```

Example (TypeScript):

```ts
import type { Config } from "@jest/types";
import { withJestSlipDetection } from "@jobber/jest-a-coverage-slip-detector";

const config: Config.InitialOptions = {
  coverageReporters: [
    "json-summary" // plus any other reporters, e.g. "lcov", "text", "text-summary"
  ],
  collectCoverage: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  }
};

export default withJestSlipDetection(config);
```

## Configure Scripts

Within `package.json`:
```js
{
  "scripts": {
    "test": "jest --coverage", // or set `collectCoverage` to `true` in Jest config
    "posttest": "jest-a-coverage-slip-detector",
    "jest:updateCoverageExceptions": "jest-a-coverage-slip-detector --update", // Used to 'ratchet' up coverage after improving it.
    "jest:updateCoverageExceptionsForce": "jest-a-coverage-slip-detector --force-update" // Used to set the initial per file snapshot or to force accept a reduction in coverage.
  }
}
```

## Configure Coverage Goals

If you're happy with the defaults below, nothing further is needed:

```js
{
  "coverageGoal": { "lines": 80, "functions": 80, "statements": 80, "branches": 80 },
  "coverageGlob": [
    "**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
  ]
}
```

Otherwise:
- Create a `.jest-a-coverage-slip-detector` directory in the root of your project
- Create a `config.json` file within the `.jest-a-coverage-slip-detector` directory

Example:
```js
{
  "coverageGoal": { "lines": 90, "functions": 90, "statements": 90, "branches": 90 },
  "coverageGlob": ["./app/javascript/**/*.{ts,tsx,js,jsx}"]
}
```

## Usage

### First Run

1. Generate and view coverage errors: `npm test`
1. Snapshot current coverage errors as legacy exceptions: `npm run jest:updateCoverageExceptionsForce`
1. Commit the generated exception listing (`generatedCoverageExceptions.json` by default) to source control

### Going Forward

- Run `npm test` as normal (locally or in CI), any slips in test coverage will fail out the command. Note that this will happen for either legacy files not meeting their recorded targets, or in new files not meeting the configured goals.
- If you want to soft-launch the tooling, use the `--report-only` option in the initial rollout, and remove the option once you're ready to require coverage errors to be addressed.
- As improvements to test coverage are made to legacy files, run `npm run jest:updateCoverageExceptions` to update the exception listing (and commit it) to "ratchet" up the coverage.

## Concurrency and Parallelism

If you're leveraging parallelism to do test splitting and running your tests concurrently on CI (e.g. fan-out/fan-in), a few adjustments to the pattern are needed. Collecting coverage while testing and reporting using `postpost` will result in reporting happening multiple times on each concurrent test run, potentially against incomplete coverage numbers.

If parallelism is being used:
1. Collect full `json` coverage reports - this will happen automatically if you configure a `mergeCoveragePath` and use `--ci` in your CI's test command.
    - You will need to configure your CI to collect these in such a way that they can be located later using the path configured in `mergeCoveragePath`. For CircleCI, this means adding them to a workspace folder with unique names.
1. Ensure you aren't triggering `posttest` in your CI - this means using jest directly in a CI specific test command and avoiding calling `npm test` in CI.
1. Setup an additional job in the CI (e.g. `test_coverage`) that runs after the concurrent testing is completed.
    - Explicitly run posttest with the merge argument: `npm run posttest -- --merge`.

<img src="https://circleci.com/docs/assets/img/docs/fan-out-in.png" width="300">


Example `package.json` script:
```js
{
  "scripts": {
    "test:ci": "jest --coverage --runInBand --reporters=default --reporters=jest-junit --ci", // don't trigger posttest
  }
}
```

Example `config.json`:
```js
{
  ...
  "mergeCoveragePath": "workspace/final-coverage-files",
  ...
}
```


## CLI
```console
$ jest-a-coverage-slip-detector --help
Usage: jest-a-coverage-slip-detector [options]

Options:
  --help, -h             Show this help

  --update               Update exceptions with improved coverage levels.
                         Used to 'ratchet' up coverage after improving it.

  --force-update         Record current coverage errors as exceptions.
                         Used to:
                           - Snapshot current coverage errors as legacy exceptions.
                           - Force accept a reduction in coverage.

  --merge                Merges together concurrently collected coverage

  --report-only          Exit successfully even if coverage errors are detected.
```

## FAQ

*After I'm setup with this library, what if I decide to raise the coverage goal higher for new code?*

- No problem! Just set the goal higher in the project's `jest-a-coverage-slip-detector/config.json` file and then update snapshots using `npm run jest:updateCoverageExceptionsForce`.

*Do I need to use different test commands on dev than I would on CI?*

- No. In both cases, coverage will run and you will get failures on slippages and messaging if improvements are detected.

*What if I just want to test a specific file, will I incur a full coverage scan?*

- No. If a test path pattern is detected (e.g. `npm test tests/foo.test.ts`) coverage will only be calculated for the code under test.

*How do I incrementally add test coverage to a previously uncovered file without having testing fail due to the goal being unmet?*

- This library dynamically leverages `collectCoverageFrom` in order to capture snapshots on files even if they are completely untested. This means that as you incrementally add test coverage, instead of a failure, you'll be greeted with a message celebrating the improved coverage and recommending that you update snapshots to bump up the threshold for that file.

*What exactly is the purpose of `withJestSlipDetection`?*

- In order to properly ensure coverage reporting at a per file level we need to collect coverage from every file. If you run Jest against a single file then the calculated coverage for other files will report incorrectly even if they do have tests that just weren't executed by this focused run. To guard against this `withJestSlipDetection` will intelligently set Jest's internal `collectCoverageFrom`.
