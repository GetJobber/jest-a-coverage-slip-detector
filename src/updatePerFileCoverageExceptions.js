const fs = require("fs");
const path = require("path");
const minimatch = require("minimatch");
const { loadConfig, configDir, projectDir } = require("./config");
const {
  fromCoverageFiles,
  perFileCoverageReport,
  logViolations,
  coverageLessThan,
} = require("./coverageUtilities");
const { mergeCoverageAndGenerateSummaryReport } = require("./mergeCoverage");

function ensurePathExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

exports.updatePerFileCoverageExceptions =
  function updatePerFileCoverageExceptions(forceUpdate = false) {
    const config = loadConfig();
    if (config.input.alwaysMerge) {
      mergeCoverageAndGenerateSummaryReport();
    }

    const { writeFileSync } = require("fs");

    const { coverageSummary, coverageExceptions, coverageIgnore } =
      fromCoverageFiles();

    const {
      filesBelowCoverageThreshold,
      exceptionsBelowCoverageThreshold,
      coverageError,
    } = perFileCoverageReport(
      coverageSummary,
      coverageIgnore,
      coverageExceptions,
    );

    if (!forceUpdate && coverageError) {
      logViolations(
        filesBelowCoverageThreshold.concat(exceptionsBelowCoverageThreshold),
        config.messages.belowThreshold,
        exceptionsBelowCoverageThreshold.length > 0
          ? config.messages.belowLegacyThreshold
          : undefined,
      );

      return;
    }

    const allExceptions = Object.entries(coverageSummary).reduce(
      (exceptions, [fullFile, coverage]) => {
        const file = fullFile.replace(projectDir, ".");
        if (coverageIgnore.some(ignoreGlob => minimatch(file, ignoreGlob))) {
          // Skip ignored file.
        } else if (coverageLessThan(coverage, config.coverageGoal, 0)) {
          exceptions[file] = coverageException(coverage, config.coverageGoal);
        }

        return exceptions;
      },
      {},
    );

    const generatedCoverageExceptionsPath = path.resolve(
      configDir,
      config.output.generatedCoverageExceptionsPath,
    );
    ensurePathExists(generatedCoverageExceptionsPath);
    writeFileSync(
      generatedCoverageExceptionsPath,
      JSON.stringify(allExceptions, undefined, 2),
    );

    function coverageException(current, goal) {
      return Object.entries(current).reduce(
        (accumulator, [key, { pct: percent }]) => {
          accumulator[key] = Math.min(percent, goal[key]);
          return accumulator;
        },
        {},
      );
    }
  };
