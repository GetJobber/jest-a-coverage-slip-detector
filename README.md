# `@jobber/jest-a-coverage-slip-detector`

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/%40jobber%2Fjest-a-coverage-slip-detector.svg)](https://badge.fury.io/js/%40jobber%2Fjest-a-coverage-slip-detector)

This library ensures that new files have [Jest](https://jestjs.io/) coverage meeting the configured goals.

Additionally, this library can be added to an existing project such that legacy files not meeting the coverage goals are added to an exception list where they raise an error if coverage slips, and ratchet upwards as progress is made improving them, all while enforcing the higher coverage goals on net new code.

- supports JavaScript and TypeScript projects
- prevents coverage from slipping, even on legacy files
- detects coverage improvements and prints messaging to update snapshots
- designed for CI; updating snapshots is a separate explicit activity
- supports monitoring completely untested code through dynamic usage of `collectCoverageFrom`
- supports coverage merging for usage with parallelized testing
- generates an html coverage report (by default)

## Requirements

- Jest

## Installation

`npm install --save-dev @jobber/jest-a-coverage-slip-detector`

## Configure Jest

Within `jest.config.js` or `jest.config.ts`:
1. Ensure Jest is configured to include `json` in `coverageReporters`.
1. Ensure that coverage collection is enabled in the CI command (e.g. with the `--coverage` parameter).
1. Either remove the `coverageThreshold` configuration from Jest, or set it to: `coverageThreshold: { global: {} }`.
1. Wrap the configuration with the `withJestSlipDetection` utility method in order to dynamically leverage `collectCoverageFrom` set to the configured `coverageGlob`.

Example (JavaScript):

```js
const { withJestSlipDetection } = require("@jobber/jest-a-coverage-slip-detector");

module.exports = withJestSlipDetection({
  coverageReporters: [
    "json" // plus any other reporters, e.g. "lcov", "text", "text-summary"
  ],
  coverageThreshold: { global: {} },
});
```

Example (TypeScript):

```ts
import type { Config } from "@jest/types";
import { withJestSlipDetection } from "@jobber/jest-a-coverage-slip-detector";

const config: Config.InitialOptions = {
  coverageReporters: [
    "json" // plus any other reporters, e.g. "lcov", "text", "text-summary"
  ],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  }
};

export default withJestSlipDetection(config);
```

## Configure Scripts

These scripts assume you have the following two reporters installed:
```
npm i -D jest-progress-bar-reporter jest-junit
```

Within `package.json`:
```js
{
  "scripts": {
    "test": "jest",
    "test:ci": "jest --runInBand --coverage --reporters=jest-progress-bar-reporter --reporters=jest-junit --ci",
    "posttest:ci": "npm run test:validateCoverage",
    "test:generateCoverage": "jest --coverage --reporters=jest-progress-bar-reporter --ci",
    "test:validateCoverage": "jest-a-coverage-slip-detector",
    "test:updateCoverageExceptions": "jest-a-coverage-slip-detector --update", // Used to 'ratchet' up coverage after improving it.
    "test:setCoverageExceptionsBaseline": "jest-a-coverage-slip-detector --force-update" // Sets the baseline for test coverage (accepts any under-target coverage).
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

1. Generate and view coverage errors: `npm run test:generateCoverage && npm run test:validateCoverage`
1. Snapshot current coverage errors as legacy exceptions: `npm run test:setCoverageExceptionsBaseline`
1. Commit the generated exception listing (`generatedCoverageExceptions.json` by default) to source control
1. Use `npm run test:ci` in your CI (the key things are that coverage is enabled and that the `--ci` argument is present)

### Going Forward

- Any slips in test coverage will fail out the CI command. Note that this will happen for either legacy files not meeting their recorded targets, or in new files not meeting the configured goals.
- Any improvements in test coverage will also fail out the CI command with a prompt to run `npm run test:generateCoverage && npm run test:updateCoverageExceptions` and commit the updated exception listing to "ratchet" up the coverage.
- If you want to soft-launch the tooling, use the `--report-only` option in the initial rollout, and remove the option once you're ready to require coverage errors to be addressed.

## Concurrency and Parallelism

If you're leveraging parallelism to do test splitting and running your tests concurrently on CI (e.g. fan-out/fan-in), a few adjustments to the pattern are needed.

<img src="https://circleci.com/docs/assets/img/docs/fan-out-in.png" width="300">

1. Remove the `posttest:ci` script - you'll need to explicitly invoke coverage validation as a separate step after you gather coverage on the concurrent runs.

Use `jest` to generate the files to be tested so you ensure you have parity with the test run and coverage gathering used to generate the exceptions:
```js
TESTFILES=$(npx jest --listTests | sed s:$PWD/:: | circleci tests split --split-by=timings --show-counts)
npm run test:ci $TESTFILES
```

2. You will need to configure your CI to keep the full `json` coverage reports around for a follow-up validation step in your workflow. Ensure these can be located later under the coverage output directory (both [jest](https://jestjs.io/docs/configuration#coveragedirectory-string) and `mergeCoveragePath` should be set to the same directory). For CircleCI, this means adding them to a workspace folder with unique names:
```js
// example
COVERAGE_REPORT_SHARD=coverage/coverage-final${CIRCLE_NODE_INDEX}.json
npm run test:ci $TESTFILES && mv coverage/coverage-final.json $COVERAGE_REPORT_SHARD
```

3. Setup an additional job in the CI (e.g. `test_coverage`) that runs after the concurrent testing is completed.
    - Explicitly run `test:validateCoverage` with the `merge` argument: `npm run test:validateCoverage -- --merge`.

Example `config.json` (the `mergeCoveragePath` directory should [match jest](https://jestjs.io/docs/configuration#coveragedirectory-string)):
```js
{
  ...
  "mergeCoveragePath": "coverage",
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

## Testing locally
- Run `npm install` in this repo to ensure everything is up-to-date
- Run `npm link` to register the package locally
- In the repo consuming this package, run `npm link @jobber/jest-a-coverage-slip-detector`
- Run `jest-a-coverage-slip-detector` - it will run this repo's code directly!

## FAQ

*After I'm setup with this library, what if I decide to raise the coverage goal higher for new code?*

- No problem! Just set the goal higher in the project's `jest-a-coverage-slip-detector/config.json` file and then update snapshots using `npm run test:setCoverageExceptionsBaseline`.

*Do I need to use different test commands on dev than I would on CI?*

- Yes, you should. CI test commands for Jest are intended to include `--runInBand` and `--ci` on CI.

*Why do I only see the coverage errors on CI and not locally?*

- It takes a full test run to get reliable coverage numbers to use for checking for slippages or messaging if improvements are detected. For example, if you run Jest against a single file then the calculated coverage for other files will report incorrectly even if they do have tests that just weren't executed by this focused run. However, if your tests run fast enough and you are accustomed to running the full suite locally, feel free to run `npm run test:validateCoverage` (e.g. perhaps via a `posttest` script).

*What if I'm running tests locally, will I be slowed down by coverage scanning?*

- No. Code coverage is only expected to be enabled on CI (although feel free to enable it locally for other use cases!).

*How do I incrementally add test coverage to a previously uncovered file without having testing fail due to the goal being unmet?*

- This library dynamically leverages `collectCoverageFrom` in order to capture snapshots on files even if they are completely untested. This means that as you incrementally add test coverage, you'll be greeted with a message in the CI failure celebrating the improved coverage and asking that you update snapshots to bump up the threshold for that file.

*What exactly is the purpose of `withJestSlipDetection`?*

- In order to properly gather coverage reporting at a per file level we need to collect coverage from every file. To guard against this `withJestSlipDetection` will intelligently set Jest's internal `collectCoverageFrom`. This mechanism also allows some validation of key Jest configuration to be performed, to help identify misconfigurations that would impact this tooling.
