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
  mergeCoveragePath: "coverage",
  tolerance: 0,
  input: {
    coverageSummaryPath: "coverage/coverage-summary.json",
    coverageIgnorePath: "coverageIgnore.json",
    alwaysMerge: true,
    mergePrefix: "coverage-final",
  },
  output: {
    generatedCoverageExceptionsPath: "generatedCoverageExceptions.json",
    additionalReports: {
      html: "coverage/html-report",
    },
  },
  messages: {
    belowThreshold:
      "The following files are below the test coverage goals. Add more coverage!",
    belowLegacyThreshold:
      "Note that some of these files only need to be brought up to their legacy thresholds (see the Goal column) - although feel free to bring them up beyond that.",
    aboveThreshold:
      "Congratulations! The test coverage in the following files has been improved, let's lock in the updated thresholds.",
    regeneratePrompt: `After a complete and passing ${chalk.yellow(
      "`npm run test:generateCoverage`,",
    )} use ${chalk.yellow(
      "`npm run test:updateCoverageExceptions`",
    )} to update the coverage threshold for these files.`,
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
  const config = loadConfig();
  const args = process.argv.slice(2);

  setupCollectCoverageFrom(args, config, jestConfig);
  validateJestConfig(jestConfig, args);

  return jestConfig;
};

function setupCollectCoverageFrom(args, config, jestConfig) {
  const isCI = args.some(arg => arg === "--ci");
  if (isCI && !jestConfig.collectCoverageFrom && config.coverageGlob) {
    jestConfig.collectCoverageFrom = [].concat(config.coverageGlob);
  }
}

function validateJestConfig(jestConfig, args) {
  const isCI = args.some(arg => arg === "--ci");
  const warnings = [];

  if (
    isCI &&
    !jestConfig.collectCoverage &&
    !args.some(arg => arg === "--coverage")
  ) {
    warnings.push(
      "Ensure the `--coverage` argument is used in your CI command, or alternatively, enable `collectCoverage` in the Jest configuration.",
    );
  }

  if (
    !jestConfig.coverageReporters ||
    !jestConfig.coverageReporters.some(reporter => reporter === "json")
  ) {
    warnings.push(
      "Ensure `json` is added into `coverageReporters` in the Jest configuration.",
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
