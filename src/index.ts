import { AggregatedResult, TestResult } from "@jest/test-result";
import { Circus, Config } from "@jest/types";

import markdownreporter from "./markdown-reporter";
import {
  JestMarkdownReporterConfigurationOptions,
  JestMarkdownReporterConsole,
  JestMarkdownReporterProps,
} from "./types";

/**
 * Setup Jest Markdown Reporter and generate a report with the given data
 */
const setupAndRun = (data: JestMarkdownReporterProps) => {
  const reporter = new markdownreporter(data);
  return reporter.generate();
};

/**
 * The test runner function passed to Jest
 */
function JestMarkdownReporter(
  globalConfig: Config.GlobalConfig | AggregatedResult,
  options: JestMarkdownReporterConfigurationOptions
): Promise<Circus.TestResult> | Config.GlobalConfig | AggregatedResult {
  const consoleLogs: JestMarkdownReporterConsole[] = [];

  /**
   * If the first parameter has a property named 'testResults',
   * the script is being run as a 'testResultsProcessor'.
   * We then need to return the test results as they were received from Jest
   * https://facebook.github.io/jest/docs/en/configuration.html#testresultsprocessor-string
   */
  if (Object.prototype.hasOwnProperty.call(globalConfig, "testResults")) {
    const testData = globalConfig as AggregatedResult;
    setupAndRun({
      testData,
      options,
    });
    // Return the results as required by Jest
    return testData;
  }

  /**
   * The default behaviour - run as Custom Reporter, in parallel with Jest.
   * https://facebook.github.io/jest/docs/en/configuration.html#reporters-array-modulename-modulename-options
   */

  this.onTestResult = (data: any, result: TestResult) => {
    // Catch console logs per test
    // TestResult will only contain console logs if Jest is run with verbose=false
    if (result.console) {
      consoleLogs.push({
        filePath: result.testFilePath,
        logs: result.console,
      });
    }
  };

  this.onRunComplete = (contexts: any, testData: AggregatedResult) =>
    setupAndRun({
      testData,
      options,
      jestConfig: globalConfig as Config.GlobalConfig,
      consoleLogs,
    });
}

export default JestMarkdownReporter;
