import fs from "fs";

import MarkdownReporter from "../src/markdown-reporter";
import {
  mockedJestResponseMultipleTestResult,
  mockedJestResponseSingleTestResult,
} from "./mockdata";

describe("MarkdownReporter", () => {
  describe("generate", () => {
    it("should be able to generate a markdown report", async () => {
      const mockedFS = jest.spyOn(fs, "writeFileSync");
      mockedFS.mockImplementation();

      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      const report = await reporter.generate();

      expect(report.toString().substring(0, 6)).toEqual("<html>");
      mockedFS.mockRestore();
    });
  });

  describe("renderTestReport", () => {
    it("should cast an error if no test data was provided", async () => {
      expect.assertions(1);
      // @ts-ignore
      const reporter = new MarkdownReporter({});
      expect(await reporter.renderTestReport()).toBeUndefined();
    });
  });

  describe("getConfigValue", () => {
    it("should return configured environment variable", async () => {
      process.env.JEST_MARKDOWN_REPORTER_LOGO = "logoFromEnv.png";
      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      const reportContent = (
        await reporter.renderTestReport()
      ).toString();

      expect(
        reportContent.indexOf('![](logoFromEnv.png)')
      ).toBeGreaterThan(-1);
      delete process.env.JEST_MARKDOWN_REPORTER_LOGO;
    });
  });

  describe("config options", () => {
    /* TODO: The following test runs locally, but fails in Travis CI
    describe("boilerplate", () => {
      it("should insert the test report HTML into the given file", async () => {
        const mockedFS = jest.spyOn(fs, "readFileSync");
        mockedFS.mockImplementation(
          () => "<div>{jesthtmlreporter-content}</div>"
        );
        const reporter = new HTMLReporter(mockedJestResponseSingleTestResult, {
          boilerplate: path.join(process.cwd(), "/path/to/boilerplate.html")
        });

        const report = await reporter.renderTestReport();
        expect(report).toEqual(
          `<div>${mockedSingleTestResultReportHTML}</div>`
        );
        mockedFS.mockRestore();
      });
    });
    */

    describe("includeConsoleLog", () => {
      it("should add found console.logs to the report if includeConsoleLog is set", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {
            includeConsoleLog: true,
          },
          consoleLogs: [
            {
              filePath:
                mockedJestResponseSingleTestResult.testResults[0].testFilePath,
              logs: [
                {
                  message: "This is a console log",
                  origin: "origin",
                  type: "log",
                },
              ],
            },
          ],
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();
        expect(
          reportContent.indexOf(
            '```\nThis is a console log\n```'
          )
        ).toBeGreaterThan(-1);
      });

      it("should not add any console.logs to the report if includeConsoleLog is false", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {},
          consoleLogs: [
            {
              filePath:
                mockedJestResponseSingleTestResult.testResults[0].testFilePath,
              logs: [
                {
                  message: "This is a console log",
                  origin: "origin",
                  type: "log",
                },
              ],
            },
          ],
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();
        expect(
          reportContent.indexOf(
            '```\nThis is a console log\n```'
          )
        ).toBe(-1);
      });
    });

    describe("statusIgnoreFilter", () => {
      it("should remove tests with the specified status", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseMultipleTestResult,
          options: {
            statusIgnoreFilter: "passed",
          },
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();

        expect(reportContent.indexOf('✅')).toBe(-1);
      });
    });

    describe("includeFailureMsg", () => {
      it("should include failure messages", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseMultipleTestResult,
          options: {
            includeFailureMsg: true,
          },
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();

        expect(
          reportContent.indexOf('❌')
        ).toBeGreaterThan(-1);
      });
    });

    describe.skip("includeSuiteFailure", () => {
      it("should include suite failure message", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseMultipleTestResult,
          options: {
            includeSuiteFailure: true,
          },
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();

        expect(
          reportContent.indexOf('❌')
        ).toBeGreaterThan(-1);
      });
    });

    describe.skip("includeObsoleteSnapshots", () => {
      it("should include obsolete snapshots", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseMultipleTestResult,
          options: {
            includeObsoleteSnapshots: true,
          },
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();

        expect(
          reportContent.indexOf('<div class="summary-obsolete-snapshots">')
        ).toBeGreaterThan(-1);
        expect(
          reportContent.indexOf('<div class="suite-obsolete-snapshots">')
        ).toBeGreaterThan(-1);
      });
    });

    describe("logo", () => {
      it("should add a logo to the report", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {
            logo: "logo.png",
          },
        });
        const reportContent = (
          await reporter.renderTestReport()
        ).toString();

        expect(
          reportContent.indexOf('![](logo.png)')
        ).toBeGreaterThan(-1);
      });
    });

    describe("pageTitle", () => {
      it("should add the given string as a title tag", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {
            pageTitle: "My Report",
          },
        });
        const report = (await reporter.renderTestReport()).toString();

        expect(report.indexOf('# My Report')).toBeGreaterThan(
          -1
        );
      });
    });

    describe.skip("executionTimeWarningThreshold", () => {
      it("should mark tests that have surpassed the threshold", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {
            executionTimeWarningThreshold: 0.00001,
          },
        });
        const report = (await reporter.renderTestReport()).toString();

        expect(report.indexOf('<div class="suite-time warn">')).toBeGreaterThan(
          -1
        );
      });
    });

    describe("dateFormat", () => {
      it("should format the date in the given format", async () => {
        const reporter = new MarkdownReporter({
          testData: mockedJestResponseSingleTestResult,
          options: {
            dateFormat: "yyyy",
          },
        });
        const report = (await reporter.renderTestReport()).toString();

        expect(
          report.indexOf(`Started: <time>2020</time>`)
        ).toBeGreaterThan(-1);
      });
    });
  });

  describe("setupConfig", () => {
    it("should return default value if no options were provided", async () => {
      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      expect(reporter.config).toBeDefined();
      expect(reporter.config.append.configValue).not.toBeDefined();
      expect(reporter.getConfigValue("append")).toEqual(false);
    });
  });

  describe("replaceRootDirInPath", () => {
    it("should replace <rootDir> in the given path", () => {
      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      const result = reporter.replaceRootDirInPath(
        "mockedRoot",
        "<rootDir>/test/reporter.md"
      );

      expect(result).toContain("mockedRoot");
      expect(result).not.toContain("<rootDir>");
    });

    it("should simply return the file path if no <rootDir> is present", () => {
      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      const result = reporter.replaceRootDirInPath(
        "mockedRoot",
        "test/reporter.md"
      );

      expect(result).toBe("test/reporter.md");
    });

    it("should be able to handle cases where root is not defined", () => {
      const reporter = new MarkdownReporter({
        testData: mockedJestResponseSingleTestResult,
        options: {},
      });
      const result = reporter.replaceRootDirInPath(null, "test/reporter.md");

      expect(result).toBe("test/reporter.md");
    });
  });
});
