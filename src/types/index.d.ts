import { ConsoleBuffer } from "@jest/console";
import { Config } from "@jest/types";
import { AggregatedResult } from "@jest/test-result";

export interface JestMarkdownReporterProps {
  testData: AggregatedResult;
  options: JestMarkdownReporterConfigurationOptions;
  jestConfig?: Config.GlobalConfig;
  consoleLogs?: JestMarkdownReporterConsole[];
}

export type JestMarkdownReporterConfigurationOptions = {
  append?: boolean;
  dateFormat?: string;
  executionTimeWarningThreshold?: number;
  includeConsoleLog?: boolean;
  includeFailureMsg?: boolean;
  includeSuiteFailure?: boolean;
  includeObsoleteSnapshots?: boolean;
  logo?: string;
  outputPath?: string;
  pageTitle?: string;
  sort?: JestMarkdownReporterSortType;
  statusIgnoreFilter?: string;
  styleOverridePath?: string;
};

export interface JestMarkdownReporterConfigOption<T> {
  environmentVariable: string;
  configValue?: T;
  defaultValue: T;
}

export interface JestMarkdownReporterConfig {
  append: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["append"]
  >;
  dateFormat: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["dateFormat"]
  >;
  executionTimeWarningThreshold: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["executionTimeWarningThreshold"]
  >;
  includeConsoleLog: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["includeConsoleLog"]
  >;
  includeFailureMsg: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["includeFailureMsg"]
  >;
  includeSuiteFailure: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["includeSuiteFailure"]
  >;
  includeObsoleteSnapshots: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["includeObsoleteSnapshots"]
  >;
  logo: JestMarkdownReporterConfigOption<JestMarkdownReporterConfigurationOptions["logo"]>;
  outputPath: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["outputPath"]
  >;
  pageTitle: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["pageTitle"]
  >;
  sort: JestMarkdownReporterConfigOption<JestMarkdownReporterConfigurationOptions["sort"]>;
  statusIgnoreFilter: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["statusIgnoreFilter"]
  >;
  styleOverridePath: JestMarkdownReporterConfigOption<
    JestMarkdownReporterConfigurationOptions["styleOverridePath"]
  >;
}

export interface JestMarkdownReporterConsole {
  filePath: string;
  logs: ConsoleBuffer;
}

export type JestMarkdownReporterSortType =
  | "status"
  | "executiondesc"
  | "executionasc"
  | "titledesc"
  | "titleasc";
