const {
  fromCoverageFiles,
  perFileCoverageReport,
  logViolations,
} = require("./coverageUtilities");
const { mergeCoverageAndGenerateSummaryReport } = require("./mergeCoverage");
const { loadConfig } = require("./config");

exports.runPerFileCoverageTest = function runPerFileCoverageTest(
  mergePerformed = false,
) {
  const config = loadConfig();
  if (config.input.alwaysMerge && !mergePerformed) {
    mergeCoverageAndGenerateSummaryReport();
  }

  const { coverageSummary, coverageExceptions, coverageIgnore } =
    fromCoverageFiles();

  const {
    filesBelowCoverageThreshold,
    exceptionsBelowCoverageThreshold,
    exceptionsAboveCoverageThreshold,
    coverageError,
    coverageWarn,
  } = perFileCoverageReport(
    coverageSummary,
    coverageIgnore,
    coverageExceptions,
  );

  logViolations(
    filesBelowCoverageThreshold.concat(exceptionsBelowCoverageThreshold),
    config.messages.belowThreshold,
    exceptionsBelowCoverageThreshold.length > 0
      ? config.messages.belowLegacyThreshold
      : undefined,
  );

  logViolations(
    exceptionsAboveCoverageThreshold,
    config.messages.aboveThreshold,
    config.messages.regeneratePrompt,
    true,
  );

  return coverageError || coverageWarn;
};
