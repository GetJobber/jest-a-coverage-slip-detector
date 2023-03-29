const fs = require("fs");
const path = require("path");
const libCoverage = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");
const { loadConfig } = require("./config");

function loadData(filePath) {
  const json = fs.readFileSync(filePath);
  return JSON.parse(json);
}

function mergeCoverageMaps(files, alwaysMerge) {
  let initialData = {};
  if (files.length === 1 && alwaysMerge) {
    initialData = loadData(files[0]);
  }

  const coverageMap = libCoverage.createCoverageMap(initialData);

  files.forEach(covergeFinalFile => {
    coverageMap.merge(loadData(covergeFinalFile));
  });

  return coverageMap;
}

function generateSummaryReport(config, coverageMap) {
  const dir = path.dirname(config.input.coverageSummaryPath);
  const context = libReport.createContext({
    dir,
    coverageMap,
  });

  reports.create("json-summary").execute(context);
}

function generateHtmlReport(config, coverageMap) {
  const dir = config.input.coverageHtmlPath;
  const context = libReport.createContext({
    dir,
    coverageMap,
  });

  reports.create("html").execute(context);
}

function mergeCoverage(config) {
  if (!config.mergeCoveragePath) {
    throw "Missing required configuration option: `mergeCoveragePath`";
  }

  const files = fs.readdirSync(config.mergeCoveragePath);
  const filePaths = files
    .filter(
      file =>
        path.basename(file).startsWith(config.input.mergePrefix) &&
        path.extname(file) === ".json",
    )
    .map(file => path.join(config.mergeCoveragePath, file));

  return mergeCoverageMaps(filePaths, config.input.alwaysMerge);
}

exports.mergeCoverageAndGenerateReports =
  function mergeCoverageAndGenerateSummaryReport() {
    const config = loadConfig();
    const mergedCoverage = mergeCoverage(config);

    generateSummaryReport(config, mergedCoverage);
    generateHtmlReport(config, mergedCoverage);
  };
