const path = require("path");
const minimatch = require("minimatch");
const chalk = require("chalk");
const { table } = require("table");
const { loadConfig, configDir, projectDir } = require("./config");

exports.perFileCoverageReport = perFileCoverageReport;
function perFileCoverageReport(
  coverageSummary,
  coverageIgnore,
  coverageExceptions,
) {
  const config = loadConfig();
  const filesBelowCoverageThreshold = [];
  const exceptionsBelowCoverageThreshold = [];
  const exceptionsAboveCoverageThreshold = [];

  Object.entries(coverageSummary).forEach(([fullFile, coverage]) => {
    const file = toRelativePath(fullFile);

    if (coverageIgnore.some(ignoreGlob => minimatch(file, ignoreGlob))) {
      // Skip ignored file.
      return;
    } else if (coverageExceptions[file]) {
      // Check file against exceptions.
      if (
        coverageLessThan(coverage, coverageExceptions[file], config.tolerance)
      ) {
        exceptionsBelowCoverageThreshold.push({
          file,
          current: fullCoverageToPercent(coverage),
          goal: coverageExceptions[file],
        });
      }

      if (
        coverageGreaterThan(
          coverage,
          coverageExceptions[file],
          config.coverageGoal,
        )
      ) {
        exceptionsAboveCoverageThreshold.push({
          file,
          current: fullCoverageToPercent(coverage),
          goal: coverageExceptions[file],
        });
      }
      return;
    } else if (
      coverageLessThan(coverage, config.coverageGoal, config.tolerance)
    ) {
      // Check file normally.
      filesBelowCoverageThreshold.push({
        file,
        current: fullCoverageToPercent(coverage),
        goal: config.coverageGoal,
      });
      return;
    }
  });

  return {
    filesBelowCoverageThreshold,
    exceptionsBelowCoverageThreshold,
    exceptionsAboveCoverageThreshold,
    coverageError:
      filesBelowCoverageThreshold.length > 0 ||
      exceptionsBelowCoverageThreshold.length > 0,
    coverageWarn: exceptionsAboveCoverageThreshold.length > 0,
  };
}

exports.logViolations = logViolations;

// eslint-disable-next-line max-statements
function logViolations(
  violations,
  message,
  details,
  aboveGrandfathered = false,
) {
  if (violations.length === 0) {
    return;
  }

  const config = loadConfig();
  const infoTableData = [["🔴", message]];

  const percentColumnWidth = 18;
  const halfTerminalWidth = 80;

  if (details) {
    infoTableData.push(["", `\n${details}`]);
  }

  if (config.output.displayDocumentationPrompt) {
    infoTableData.push(["", `\n${config.messages.documentationPrompt}`]);
  }

  // eslint-disable-next-line no-console
  console.log(
    table(infoTableData, {
      singleLine: true,
      columns: {
        1: { width: halfTerminalWidth, wrapWord: true },
      },
    }),
  );

  const tableData = [];

  const tableConfig = {
    columns: {
      0: {
        width: halfTerminalWidth,
        wrapWord: true,
      },
      1: {
        width: percentColumnWidth,
      },
      2: {
        width: percentColumnWidth,
      },
    },
  };

  tableData.push(["File", "Goal", "Current"]);

  violations.forEach(violation => {
    tableData.push([
      violation.file,
      Object.entries(violation.goal)
        .map(([key, value]) => {
          if (
            aboveGrandfathered &&
            value < violation.current[key] &&
            value < config.coverageGoal[key]
          ) {
            return chalk.yellow(`${key}: ${value}`);
          }
          return `${key}: ${value}`;
        })
        .join("\n"),
      Object.entries(violation.current)
        .map(([key, value]) => {
          if (!aboveGrandfathered && violation.goal[key] > value) {
            return chalk.red(`${key}: ${value}`);
          }
          return `${key}: ${value}`;
        })
        .join("\n"),
    ]);
  });

  // eslint-disable-next-line no-console
  console.log(table(tableData, tableConfig));
}

exports.fromCoverageFiles = fromCoverageFiles;
function fromCoverageFiles() {
  const config = loadConfig();
  let coverageExceptions = {};
  try {
    const generatedCoverageExceptionsPath = path.resolve(
      configDir,
      config.output.generatedCoverageExceptionsPath,
    );
    coverageExceptions = require(generatedCoverageExceptionsPath);
  } catch (error) {
    /* do nothing */
  }

  let coverageIgnore = [];
  try {
    const coverageIgnorePath = path.resolve(
      configDir,
      config.input.coverageIgnorePath,
    );
    coverageIgnore = require(coverageIgnorePath);
  } catch (error) {
    /* do nothing */
  }

  const coverageSummaryPath = path.resolve(
    process.cwd(),
    config.input.coverageSummaryPath,
  );
  const coverageSummary = require(coverageSummaryPath);
  delete coverageSummary.total;

  return { coverageSummary, coverageExceptions, coverageIgnore };
}

exports.coverageLessThan = coverageLessThan;
function coverageLessThan(current, goal, tolerance) {
  return Object.entries(current).some(
    ([key, { pct: percent }]) => percent + tolerance < goal[key],
  );
}

function fullCoverageToPercent(coverage) {
  return Object.entries(coverage).reduce(
    (accumulator, [key, { pct: percent }]) => {
      accumulator[key] = percent;
      return accumulator;
    },
    {},
  );
}

function coverageGreaterThan(current, goal, overallGoal) {
  return Object.entries(current).some(([key, { pct: percent }]) => {
    // Cap percent at our overall goal.
    percent = Math.min(overallGoal[key], percent);
    return percent > goal[key];
  });
}

function toRelativePath(file) {
  return file.replace(projectDir, ".");
}
