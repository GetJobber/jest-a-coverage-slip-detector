const fs = require("fs");
const path = require("path");
const libCoverage = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");
const { loadConfig } = require("./config");

const JSON_SUMMARY_REPORT_KEY = "json-summary";
const HTML_REPORT_KEY = "html";

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
  function mergeCoverageAndGenerateReports() {
    const config = loadConfig();
    const mergedCoverage = mergeCoverage(config);

    // We always want to produce the json-summary report because it is required
    // for the validation phase.
    const reportsToProduce = [
      JSON_SUMMARY_REPORT_KEY,
      ...config.output.additionalReports,
    ];

    for (const reportType of reportsToProduce) {
      const directoryFromConfig = reportsTypeMap[reportType];
      const context = libReport.createContext({
        dir: directoryFromConfig(config),
        coverageMap: mergedCoverage,
      });

      reports.create(reportType).execute(context);
    }
  };

const reportsTypeMap = {
  [HTML_REPORT_KEY]: config => config.output.generatedHtmlPath,
  [JSON_SUMMARY_REPORT_KEY]: config =>
    path.dirname(config.input.coverageSummaryPath),
};
