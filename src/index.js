module.exports = {
  runPerFileCoverageTest: require("./runPerFileCoverageTest")
    .runPerFileCoverageTest,
  updatePerFileCoverageExceptions: require("./updatePerFileCoverageExceptions")
    .updatePerFileCoverageExceptions,
  withJestSlipDetection: require("./config").withJestSlipDetection,
  mergeCoverageAndGenerateSummaryReport:
    require("./mergeCoverage").mergeCoverageAndGenerateSummaryReport,
};
