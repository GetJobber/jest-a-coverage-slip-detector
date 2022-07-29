const fs = require("fs");
const path = require("path");
const libCoverage = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");
const { loadConfig } = require("./config");

function mergeCoverageMaps(files) {
  const coverageMap = libCoverage.createCoverageMap({});

  files.forEach(covergeFinalFile => {
    const json = fs.readFileSync(covergeFinalFile);
    coverageMap.merge(JSON.parse(json));
  });

  return coverageMap;
}

function generateSummaryReport(dir, coverageMap) {
  const context = libReport.createContext({
    dir,
    coverageMap,
  });

  reports.create("json-summary").execute(context);
}
exports.mergeCoverageAndGenerateSummaryReport =
  function mergeCoverageAndGenerateSummaryReport() {
    const config = loadConfig();
    if (!config.mergeCoveragePath) {
      throw "Missing required configuration option: `mergeCoveragePath`";
    }

    const files = fs.readdirSync(config.mergeCoveragePath);
    const filePaths = files.map(file =>
      path.join(config.mergeCoveragePath, file),
    );
    const coverageMap = mergeCoverageMaps(filePaths);
    const dir = path.dirname(config.input.coverageSummaryPath);
    generateSummaryReport(dir, coverageMap);
  };
