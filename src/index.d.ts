declare module "@jobber/jest-a-coverage-slip-detector" {
  export function runPerFileCoverageTest(): boolean;

  export function updatePerFileCoverageExceptions(forceUpdate: boolean): void;

  export function withJestSlipDetection(jestConfig: {
    collectCoverageFrom?: string[];
  }): any;
}
