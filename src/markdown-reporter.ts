import { AggregatedResult, TestResult } from "@jest/test-result";
import { Config } from "@jest/types";
import dateformat from "dateformat";
import fs from "fs";
import mkdirp from "mkdirp";
import path from "path";
import {
  JestMarkdownReporterConfig,
  JestMarkdownReporterConfigurationOptions,
  JestMarkdownReporterConsole,
  JestMarkdownReporterProps,
  JestMarkdownReporterSortType,
} from "src/types";
import stripAnsi from "strip-ansi";

import sorting from "./sorting";

class MarkdownReporter {
  public testData: AggregatedResult;
  public consoleLogList: JestMarkdownReporterConsole[];
  public jestConfig: Config.GlobalConfig;
  public config: JestMarkdownReporterConfig;

  constructor(data: JestMarkdownReporterProps) {
    this.testData = data.testData;
    this.jestConfig = data.jestConfig;
    this.consoleLogList = data.consoleLogs;
    this.setupConfig(data.options);
  }

  public async generate() {
    try {
      const report = await this.renderTestReport();
      const outputPath = this.replaceRootDirInPath(
        this.jestConfig ? this.jestConfig.rootDir : "",
        this.getConfigValue("outputPath") as string
      );

      await mkdirp(path.dirname(outputPath));
      if (this.getConfigValue("append") as boolean) {
        await this.appendToFile(outputPath, report.toString());
      } else {
        await fs.writeFileSync(outputPath, report.toString());
      }

      this.logMessage("success", `Report generated (${outputPath})`);
      return report;
    } catch (e) {
      this.logMessage("error", e);
    }
  }

  public renderTestSuiteInfo(suite: TestResult) {
    // Suite Path
    let result = `\n# ${suite.testFilePath}`
    // Suite execution time
    const executionTime = (suite.perfStats.end - suite.perfStats.start) / 1000;
    const icon = executionTime > (this.getConfigValue('executionTimeWarningThreshold')) ? "⚠️ " : ""
    result += `\n${icon}${executionTime}`
    return result
  }

  public renderSuiteFailure(suite: TestResult, i: number) {
    // Suite Information
    return `\n${this.renderTestSuiteInfo(suite)}\n\n❌ ${this.sanitizeOutput(suite.failureMessage)}`;
  }

  public async renderTestReport() {
    try {
      if (!this.testData || Object.entries(this.testData).length === 0) {
        throw Error("No test data provided");
      }

      let report = ""

      report += `# ${this.getConfigValue("pageTitle")}`;

      // Logo
      const logo = this.getConfigValue("logo");
      if (logo) {
        report += `\n\n![](${logo})`;
      }

      // Timestamp
      if (this.testData.startTime && !isNaN(this.testData.startTime)) {
        const timestamp = new Date(this.testData.startTime);
        if (timestamp) {
          const formattedTimestamp = dateformat(
            timestamp,
            this.getConfigValue("dateFormat") as string
          );

          report += `\n\nStarted: <time datetime="${timestamp.toISOString()}">${formattedTimestamp}</time>`
        }
      }
      
      // Summary
      report += `\n\n## Summary`
      report += `\n\n### Suites

 - ${this.testData.numPassedTestSuites > 0 ? '✅' : ''} Passed: ${this.testData.numPassedTestSuites}
 - ${this.testData.numFailedTestSuites > 0 ? '❌' : ''} Failed: ${this.testData.numFailedTestSuites}
 - ${this.testData.numPendingTestSuites > 0 ? '🕑' : ''} Pending: ${this.testData.numPendingTestSuites}
 - **Total**: ${this.testData.numTotalTestSuites}
`

      if (
        this.testData.snapshot &&
        this.testData.snapshot.unchecked > 0 &&
        this.getConfigValue("includeObsoleteSnapshots")
      ) {
        report += `\n\n### Snapshots\n\n${this.testData.snapshot.unchecked} obsolete snapshots`
      }

      report += `\n\n### Tests

 - ${this.testData.numPassedTests > 0 ? '✅' : ''} Passed: ${this.testData.numPassedTests}
 - ${this.testData.numFailedTests > 0 ? '❌' : ''} Failed: ${this.testData.numFailedTests}
 - ${this.testData.numPendingTests > 0 ? '🕑' : ''} Pending: ${this.testData.numPendingTests}
 - **Total**: ${this.testData.numTotalTests}
`

      /**
       * Apply any given sorting method to the test results
       */
      const sortedTestResults = sorting(
        this.testData.testResults,
        this.getConfigValue("sort") as JestMarkdownReporterSortType
      );

      /**
       * Setup ignored test result statuses
       */
      const statusIgnoreFilter = this.getConfigValue(
        "statusIgnoreFilter"
      ) as string;
      let ignoredStatuses: string[] = [];
      if (statusIgnoreFilter) {
        ignoredStatuses = statusIgnoreFilter
          .replace(/\s/g, "")
          .toLowerCase()
          .split(",");
      }

      /**
       * Test Suites
       */
      if (sortedTestResults) {
        sortedTestResults.map((suite, i) => {
          // Ignore this suite if there are no results
          if (!suite.testResults || suite.testResults.length <= 0) {
            if (
              suite.failureMessage &&
              this.getConfigValue("includeSuiteFailure")
            ) {
              report += this.renderSuiteFailure(suite, i);
            }
            return;
          }

          // Suite Information
          report += this.renderTestSuiteInfo(suite);

          // Test Results
          suite.testResults
            // Filter out the test results with statuses that equals the statusIgnoreFilter
            .filter((s) => !ignoredStatuses.includes(s.status))
            .forEach(async (test) => {
              report += `\n\n### ${test.ancestorTitles.join(' > ') ?? ''} ${test.title}\n\n**${test.status}** in **${test.duration / 1000}s**`

              // Test Failure Messages
              if (
                test.failureMessages &&
                test.failureMessages.length > 0 &&
                this.getConfigValue("includeFailureMsg")
              ) {
                report += `\n${test.failureMessages.map(msg => `\n\`\`\`\n${this.sanitizeOutput(msg)}\n\`\`\``)}`
              }
            });

          // All console.logs caught during the test run
          if (
            this.consoleLogList &&
            this.consoleLogList.length > 0 &&
            this.getConfigValue("includeConsoleLog")
          ) {
            report += this.renderSuiteConsoleLogs(suite);
          }

          if (
            suite.snapshot &&
            suite.snapshot.unchecked > 0 &&
            this.getConfigValue("includeObsoleteSnapshots")
          ) {
            report += this.renderSuiteObsoleteSnapshots(suite);
          }
        });
      }

      return report;
    } catch (e) {
      this.logMessage("error", e);
    }
  }

  public renderSuiteConsoleLogs(
    suite: TestResult
  ) {
    // Filter out the logs for this test file path
    const filteredConsoleLogs = this.consoleLogList.find(
      (logs) => logs.filePath === suite.testFilePath
    );

    if (filteredConsoleLogs && filteredConsoleLogs.logs.length > 0) {
      return `\n\n\`\`\`\n${filteredConsoleLogs.logs.map(log => `\n${this.sanitizeOutput(log.origin)}: ${this.sanitizeOutput(log.message)}`)}\n\`\`\``
    }
    return ""
  }

  public renderSuiteObsoleteSnapshots(
    suite: TestResult
  ) {
    return `\n\n\`\`\`\n${suite.snapshot.uncheckedKeys.join("\n")}\n\`\`\``
  }

  /**
   * Fetch and setup configuration
   */
  public setupConfig(
    options: JestMarkdownReporterConfigurationOptions
  ): JestMarkdownReporterConfig {
    // Extract config values and make sure that the config object actually exist
    const {
      append,
      dateFormat,
      executionTimeWarningThreshold,
      logo,
      includeConsoleLog,
      includeFailureMsg,
      includeSuiteFailure,
      includeObsoleteSnapshots,
      outputPath,
      pageTitle,
      sort,
      statusIgnoreFilter,
      styleOverridePath,
    } = options || {};

    this.config = {
      append: {
        defaultValue: false,
        environmentVariable: "JEST_MARKDOWN_REPORTER_APPEND",
        configValue: append,
      },
      dateFormat: {
        defaultValue: "yyyy-mm-dd HH:MM:ss",
        environmentVariable: "JEST_MARKDOWN_REPORTER_DATE_FORMAT",
        configValue: dateFormat,
      },
      executionTimeWarningThreshold: {
        defaultValue: 5,
        environmentVariable:
          "JEST_MARKDOWN_REPORTER_EXECUTION_TIME_WARNING_THRESHOLD",
        configValue: executionTimeWarningThreshold,
      },
      logo: {
        defaultValue: null,
        environmentVariable: "JEST_MARKDOWN_REPORTER_LOGO",
        configValue: logo,
      },
      includeFailureMsg: {
        defaultValue: false,
        environmentVariable: "JEST_MARKDOWN_REPORTER_INCLUDE_FAILURE_MSG",
        configValue: includeFailureMsg,
      },
      includeSuiteFailure: {
        defaultValue: false,
        environmentVariable: "JEST_MARKDOWN_REPORTER_INCLUDE_SUITE_FAILURE",
        configValue: includeSuiteFailure,
      },
      includeObsoleteSnapshots: {
        defaultValue: false,
        environmentVariable: "JEST_MARKDOWN_REPORTER_INCLUDE_OBSOLETE_SNAPSHOTS",
        configValue: includeObsoleteSnapshots,
      },
      includeConsoleLog: {
        defaultValue: false,
        environmentVariable: "JEST_MARKDOWN_REPORTER_INCLUDE_CONSOLE_LOG",
        configValue: includeConsoleLog,
      },
      outputPath: {
        defaultValue: path.join(process.cwd(), "test-report.html"),
        environmentVariable: "JEST_MARKDOWN_REPORTER_OUTPUT_PATH",
        configValue: outputPath,
      },
      pageTitle: {
        defaultValue: "Test Report",
        environmentVariable: "JEST_MARKDOWN_REPORTER_PAGE_TITLE",
        configValue: pageTitle,
      },
      sort: {
        defaultValue: null,
        environmentVariable: "JEST_MARKDOWN_REPORTER_SORT",
        configValue: sort,
      },
      statusIgnoreFilter: {
        defaultValue: null,
        environmentVariable: "JEST_MARKDOWN_REPORTER_STATUS_FILTER",
        configValue: statusIgnoreFilter,
      },
      styleOverridePath: {
        defaultValue: null,
        environmentVariable: "JEST_MARKDOWN_REPORTER_STYLE_OVERRIDE_PATH",
        configValue: styleOverridePath,
      },
    };
    // Attempt to collect and assign config settings from jestmarkdownreporter.config.json
    try {
      const jestmarkdownreporterconfig = fs.readFileSync(
        path.join(process.cwd(), "jestmarkdownreporter.config.json"),
        "utf8"
      );
      if (jestmarkdownreporterconfig) {
        const parsedConfig = JSON.parse(jestmarkdownreporterconfig);
        for (const key of Object.keys(parsedConfig)) {
          if (this.config[key as keyof JestMarkdownReporterConfig]) {
            this.config[key as keyof JestMarkdownReporterConfig].configValue =
              parsedConfig[key];
          }
        }
        return this.config;
      }
    } catch (e) {
      /** do nothing */
    }
    // If above method did not work we attempt to check package.json
    try {
      const packageJson = fs.readFileSync(
        path.join(process.cwd(), "package.json"),
        "utf8"
      );
      if (packageJson) {
        const parsedConfig = JSON.parse(packageJson)["jest-markdown-reporter"];
        for (const key of Object.keys(parsedConfig)) {
          if (this.config[key as keyof JestMarkdownReporterConfig]) {
            this.config[key as keyof JestMarkdownReporterConfig].configValue =
              parsedConfig[key];
          }
        }
        return this.config;
      }
    } catch (e) {
      /** do nothing */
    }
  }

  /**
   * Returns the configurated value from the config in the following priority order:
   * Environment Variable > JSON configured value > Default value
   * @param key
   */
  public getConfigValue(key: keyof JestMarkdownReporterConfig) {
    const option = this.config[key];
    if (!option) {
      return;
    }
    if (process.env[option.environmentVariable]) {
      return process.env[option.environmentVariable];
    }
    return option.configValue || option.defaultValue;
  }

  /**
   * Appends the report to the given file and attempts to integrate the report into any existing HTML.
   * @param filePath
   * @param content
   */
  public async appendToFile(filePath: string, content: any) {
    let parsedContent = content;
    // Check if the file exists or not
    const fileToAppend = await fs.readFileSync(filePath, "utf8");
    // The file exists - we need to strip all unecessary html
    if (fileToAppend) {
      const contentSearch = /<body>(.*?)<\/body>/gm.exec(content);
      if (contentSearch) {
        const [strippedContent] = contentSearch;
        parsedContent = strippedContent;
      }
      // Then we need to add the stripped content just before the </body> tag
      let newContent = fileToAppend;
      const closingBodyTag = /<\/body>/gm.exec(fileToAppend);
      const indexOfClosingBodyTag = closingBodyTag ? closingBodyTag.index : 0;

      newContent = [
        fileToAppend.slice(0, indexOfClosingBodyTag),
        parsedContent,
        fileToAppend.slice(indexOfClosingBodyTag),
      ].join("");

      return fs.writeFileSync(filePath, newContent);
    }
    return fs.appendFileSync(filePath, parsedContent);
  }

  /**
   * Replaces <rootDir> in the file path with the actual path, as performed within Jest
   * Copy+paste from https://github.com/facebook/jest/blob/master/packages/jest-config/src/utils.ts
   * @param rootDir
   * @param filePath
   */
  public replaceRootDirInPath(
    rootDir: Config.Path,
    filePath: Config.Path
  ): string {
    if (!/^<rootDir>/.test(filePath)) {
      return filePath;
    }

    return path.resolve(
      rootDir,
      path.normalize("./" + filePath.substr("<rootDir>".length))
    );
  }

  /**
   * Method for logging to the terminal
   * @param type
   * @param message
   * @param ignoreConsole
   */
  public logMessage(
    type: "default" | "success" | "error" = "default",
    message: string
  ) {
    const logTypes = {
      default: "\x1b[37m%s\x1b[0m",
      success: "\x1b[32m%s\x1b[0m",
      error: "\x1b[31m%s\x1b[0m",
    };
    const logColor = !logTypes[type] ? logTypes.default : logTypes[type];
    const logMsg = `jest-markdown-reporter >> ${message}`;
    // Let's log messages to the terminal only if we aren't testing this very module
    if (process.env.JEST_WORKER_ID === undefined) {
      console.log(logColor, logMsg);
    }
    return { logColor, logMsg }; // Return for testing purposes
  }

  /**
   * Helper method to santize output from invalid characters
   */
  private sanitizeOutput(input: string) {
    return stripAnsi(
      input.replace(
        /([^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFC\u{10000}-\u{10FFFF}])/gu,
        ""
      )
    );
  }
}

export default MarkdownReporter;
