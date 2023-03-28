module.exports = {
  runPerFileCoverageTest: require("./runPerFileCoverageTest")
    .runPerFileCoverageTest,
  updatePerFileCoverageExceptions: require("./updatePerFileCoverageExceptions")
    .updatePerFileCoverageExceptions,
  withJestSlipDetection: require("./config").withJestSlipDetection,
  mergeCoverageAndGenerateReports:
    require("./mergeCoverage").mergeCoverageAndGenerateReports,
};
