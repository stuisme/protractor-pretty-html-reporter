For of protractor pretty html reporter with another feature of combining reports of several executions when using flake

All credit goes to the owner of protractor pretty html reporter

# protractor pretty html reporter
[![Build Status](https://travis-ci.org/stuisme/protractor-pretty-html-reporter.svg?branch=master)](https://travis-ci.org/stuisme/protractor-pretty-html-reporter)
[![Latest Version](https://img.shields.io/github/tag/stuisme/protractor-pretty-html-reporter.svg)](https://github.com/stuisme/protractor-pretty-html-reporter)
[![NPM Version](https://img.shields.io/npm/v/protractor-pretty-html-reporter.svg)](https://npmjs.org/package/protractor-pretty-html-reporter)
[![NPM Monthly Downloads](https://img.shields.io/npm/dm/protractor-pretty-html-reporter.svg)](https://npmjs.org/package/protractor-pretty-html-reporter)


```
npm i protractor-pretty-html-reporter --save-dev
```
_NOTE: jasmine is set as a peer dependency_

## Basic features
- Pass/Fail at a glance via navbar highlighting
- Bolds it('segment') within describe sentence for easy code searching
- Adds timing in milliseconds for total run time and spec run times
- Browser console logs for each spec
- Long running test support, report can be refreshed during test runs (see options)
- Suspect Line, best guess in the stack trace for your code (see options)
- Screenshots (see options)

![screen shot](/imgs/report.png)

[More Screenshots](#more-screenshots)

### Basic Setup

protractor.conf
```
var PrettyReporter = require('protractor-pretty-html-reporter').Reporter;

var prettyReporter = new PrettyReporter({
    // required, there is no default
    path: path.join(__dirname, 'results'),
    screenshotOnPassed: true
});

module.exports = {
    /* the rest of the object omitted */
    onPrepare: function() {
        jasmine.getEnv().addReporter(prettyReporter);
    },
    /* if using isSharded option see below */
    beforeLaunch() {
        prettyReporter.startReporter();
    }
};
```

#### Reporter Options
| Name                  | Type    | Default | Description                                           |
| --------------------- | ------- | ------- | ----------------------------------------------------- |
| path                  | String  |         | path the report.html will be written to (required)    |
| screenshotOnPassed    | Boolean | false   | take screenshots for passing tests too.               |
| writeReportEachSpec   | Boolean | true    | writes the report.html after each spec completes, this is recommended for long running tests |
| showBrowser           | Boolean | true    | shows browser icon on the overview                        |
| highlightSuspectLine  | Boolean | true    | highlight the "suspect line" in the dialog            |
| isSharded             | Boolean | false   | turn on if using { shardOnSpec: true} option in protractor. See above for beforeLaunch hook that is needed as well. |


## More Screenshots

### Highlight the suspect line in your stacktrace
![screen shot](/imgs/report-test-suspect-line.png)

### Show a screen shot of the error page
![screen shot](/imgs/report-with-screenshot.jpg)

### Show console logs
![screen shot](/imgs/report-with-console-logs.png)
