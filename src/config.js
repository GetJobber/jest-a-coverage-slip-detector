const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const CONFIG_DIR = ".jest-a-coverage-slip-detector";
const CONFIG_FILE = "config.json";

const projectDir = path.resolve(process.cwd());
exports.projectDir = projectDir;

const configDir = path.resolve(projectDir, CONFIG_DIR);
exports.configDir = configDir;

const defaultConfig = {
  coverageGoal: { lines: 80, functions: 80, statements: 80, branches: 80 },
  coverageGlob: [
    "**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  input: {
    coverageSummaryPath: "coverage/coverage-summary.json",
    coverageIgnorePath: "coverageIgnore.json",
  },
  output: {
    generatedCoverageExceptionsPath: "generatedCoverageExceptions.json",
  },
  messages: {
    belowThreshold:
      "The following files are below their required test coverage threshold. Raise them before updating exceptions.",
    belowLegacyThreshold:
      "Some legacy files have a lower inherited coverage threshold. Raise coverage in these files to at least this level.",
    aboveThreshold:
      "The following files are above their inherited test coverage threshold. These exceptions should be updated to meet their new level.",
    regeneratePrompt: `After a complete and passing ${chalk.yellow(
      "`npm test`",
    )} use ${chalk.yellow(
      "`npm run jest:updateCoverageExceptions`",
    )} to regenerate the required test threshold for these files.`,
  },
};

function loadConfig() {
  const configPath = path.resolve(configDir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  return { ...defaultConfig, ...require(configPath) };
}
exports.loadConfig = loadConfig;

exports.withJestSlipDetection = function withJestSlipDetection(jestConfig) {
  const cliArgumentPrefix = "-";
  const config = loadConfig();

  // collect coverage from everywhere if we don't have a testPathPattern
  const args = process.argv.slice(2);
  const hasTestPathPattern = args.some(
    arg => !arg.startsWith(cliArgumentPrefix),
  );
  const isCI = args.some(arg => arg == "--ci");
  const useCollectCoverageFrom = !hasTestPathPattern || isCI;
  if (
    useCollectCoverageFrom &&
    !jestConfig.collectCoverageFrom &&
    config.coverageGlob
  ) {
    jestConfig.collectCoverageFrom = [].concat(config.coverageGlob);
  }

  validateJestConfig(jestConfig, args);

  return jestConfig;
};

function validateJestConfig(jestConfig, args) {
  const warnings = [];

  if (!jestConfig.collectCoverage && !args.some(arg => arg === "--coverage")) {
    warnings.push(
      "Ensure `collectCoverage` is enabled in the Jest configuration or the `--coverage` argument is used.",
    );
  }

  if (
    !jestConfig.coverageReporters ||
    !jestConfig.coverageReporters.some(reporter => reporter === "json-summary")
  ) {
    warnings.push(
      "Ensure `json-summary` is added into `coverageReporters` in the Jest configuration.",
    );
  }

  const threshold = jestConfig.coverageThreshold;
  if (
    threshold &&
    (Object.keys(threshold).length > 1 ||
      !threshold.global ||
      Object.keys(threshold.global).length > 0)
  ) {
    warnings.push(
      "Either remove `coverageThreshold` in the Jest configuration, or set it to: `coverageThreshold: { global: {} }`",
    );
  }

  if (warnings.length > 0) {
    printWarnings(warnings);
  }
}

function printWarnings(warnings) {
  const attention = chalk.yellow("⚠️  WARNING ⚠️\n");

  // eslint-disable-next-line no-console
  console.warn(`${attention}${warnings.join("\n")}\n`);
}
