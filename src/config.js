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
      "`npm run test`",
    )} use ${chalk.yellow(
      "`jest-a-coverage-slip-detector --update`",
    )} to regenerate the required test threshold for these files.`,
  },
};

exports.loadConfig = function loadConfig() {
  const configPath = path.resolve(configDir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  return { ...defaultConfig, ...require(configPath) };
};
