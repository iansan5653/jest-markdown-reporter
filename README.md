<p align="center">
	<p align="center">📜</p>
	<h3 align="center">jest-markdown-reporter</h3>
	<p align="center">
		A <a href="https://github.com/facebook/jest">Jest</a> test results processor for generating a summary in Markdown.
		<br>
		<!-- (we don't have docs yet) <a href="https://github.com/Hargne/jest-html-reporter/wiki"><strong>Documentation »</strong></a>
		<br />
		<br /> -->
		<!-- (or CI) <img src="https://img.shields.io/npm/v/jest-html-reporter?style=flat-square">
		<img src="https://img.shields.io/npm/dm/jest-html-reporter?style=flat-square">
		<img src="https://img.shields.io/travis/com/hargne/jest-html-reporter?style=flat-square">
		<br />
		<br /> -->
		<small>Forked from <a href="https://github.com/matthias-schuetz/jest-html-reporter">jest-html-reporter</a></small>
		<br />
		<br />
	</p>
</p>

## Installation

```shell
$ npm install --save-dev jest-markdown-reporter
```

## Usage

Configure Jest to process the test results by adding the following entry to the Jest config (jest.config.json):

```JSON
"reporters": [
	"default",
	["./node_modules/jest-markdown-reporter", {
		"pageTitle": "Test Report"
	}]
]
```

As you run Jest from within the terminal, a file called _test-report.md_ will be created within your root folder containing information about your tests.

There are multiple configuration options available. <!-- (we don't have docs yet) To read more about these, please refer to the [documentation](https://github.com/Hargne/jest-html-reporter/wiki/configuration). -->

#### Alternative Usage as a Test Results Processor

To run the reporter as a test results processor (after Jest is complete instead of running in parallel), add the following entry to the Jest config (jest.config.json):

```JSON
{
	"testResultsProcessor": "./node_modules/jest-markdown-reporter"
}
```

**Note:** When running as a `testResultsProcessor`, the configuration needs be placed within a new file named `jestmarkdownreporter.config.json` residing in the root folder.

<!-- More information about this can be found in the [documentation](https://github.com/Hargne/jest-html-reporter/wiki/configuration). -->

### Node Compatibility

This plugin is compatible with Node version `^4.8.3`

## Configuration

Please note that all configuration properties are optional.

| Property | Type | Description | Default |
| --- | --- | --- | --- |
| `append` | `BOOLEAN` | If set to true, new test results will be appended to the existing test report | `false` |
| `dateFormat` | `STRING` | The format in which date/time should be formatted in the test report. <!-- Have a look in the [documentation](https://github.com/Hargne/jest-html-reporter/wiki/Date-Format) for the available date format variables. --> | `"yyyy-mm-dd HH:MM:ss"` |
| `executionTimeWarningThreshold` | `NUMBER` | The threshold for test execution time (in seconds) in each test suite that will render a warning on the report page. 5 seconds is the default timeout in Jest. | `5` |
| `includeConsoleLog` | `BOOLEAN` | If set to true, this will output all triggered console logs for each test suite. Please note that you have to run Jest together with `--verbose=false` in order to have Jest catch any logs during the tests. | `false` |
| `includeFailureMsg` | `BOOLEAN` | If this setting is set to true, this will output the detailed failure message for each failed test. | `false` |
| `includeSuiteFailure` | `BOOLEAN` | If set to true, this will output the detailed failure message for complete suite failures. | `false` |
| `includeObsoleteSnapshots` | `BOOLEAN` | If set to true, this will output obsolete snapshot names. | `false` |
| `logo` | `STRING` | Path to a logo that will be included in the header of the report | `null` |
| `outputPath` | `STRING` | The path to where the plugin will output the Markdown report. The path must include the filename and end with .md | `"./test-report.html"` |
| `pageTitle` | `STRING` | The title of the document. This string will also be outputted on the top of the page. | `"Test Suite"` |
| `sort` | `STRING` | Sorts the test results using the given method. <!-- Available sorting methods can be found in the [documentation](https://github.com/Hargne/jest-html-reporter/wiki/Sorting-Methods). --> | `"default"` |
| `statusIgnoreFilter` | `STRING` | A comma-separated string of the test result statuses that should be ignored when rendering the report. Available statuses are: `"passed"`, `"pending"`, `"failed"` | `null` |

## Continuous Integration

Configuration may also be performed with environment variables for dynamic file saving paths in different environments. **\*NOTE:** Environment variables will take precedence over configurations set in jesthtmlreporter.config.json and package.json\*

### Example

Here is an example of dynamically naming your output file and test report title to match your current branch that one might see in a automated deployment pipeline before running their tests.

```bash
export BRANCH_NAME=`git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3`
export JEST_MARKDOWN_REPORTER_OUTPUT_PATH=/home/username/jest-test-output/test-reports/"$BRANCH_NAME".md
export JEST_MARKDOWN_REPORTER_PAGE_TITLE="$BRANCH_NAME"\ Test\ Report
```

### Configuration Environment Variables

The environment variables reflect the configuration options available in JSON format. <!-- Please read the [documentation](https://github.com/Hargne/jest-html-reporter/wiki/configuration#configuration-environment-variables) for more information on these variables. -->
