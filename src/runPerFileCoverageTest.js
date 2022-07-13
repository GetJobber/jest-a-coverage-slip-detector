const {
  fromCoverageFiles,
  perFileCoverageReport,
  logViolations,
} = require("./coverageUtilities");
const { loadConfig } = require("./config");

exports.runPerFileCoverageTest = function runPerFileCoverageTest() {
  const config = loadConfig();

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
