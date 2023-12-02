import type { Config } from "@jest/types";

declare module "@jobber/jest-a-coverage-slip-detector" {
  export function runPerFileCoverageTest(): boolean;

  export function updatePerFileCoverageExceptions(forceUpdate: boolean): void;

  export function withJestSlipDetection(jestConfig: Config.InitialOptions): Config.InitialOptions;

  export function mergeCoverageAndGenerateReports(): void;
}
