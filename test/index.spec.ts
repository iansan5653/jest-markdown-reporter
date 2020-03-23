import fs from "fs";
import sinon from "sinon";

import JestHTMLReporter from "../src";
import {
  mockedFullReportOutput,
  mockedJestGlobalConfig,
  mockedJestResponseSingleTestResult
} from "./mockdata";

describe("index", () => {
  let writeFileSync;

  beforeEach(() => {
    writeFileSync = sinon.stub(fs, "writeFileSync").returns({});
  });
  afterEach(() => {
    writeFileSync.restore();
  });

  it("should return the jest global config if used as a testResultsProcessor", async () => {
    const input = {
      ...mockedJestGlobalConfig,
      testResults: mockedJestResponseSingleTestResult
    };

    // Trigger the reporter as a testResultsProcessor
    // @ts-ignore
    const testResultsProcessorOutput = await JestHTMLReporter(input, {});
    expect(testResultsProcessorOutput).toEqual(input);
  });
});
