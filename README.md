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
    }
};
```

#### Reporter Options
| Name                  | Type    | Default | Description                                           |
| --------------------- | ------- | ------- | ----------------------------------------------------- |
| path                  | String  |         | path the report.html will be written to (required)    |
| screenshotOnPassed    | Boolean | false   | take screenshots for passing tests too.               |
| writeReportEachSpec   | Boolean | true    | writes the report.html after each spec completes, this is recommended for long running tests |
| showBrowser           | Boolean | true    | shows browser icon on overview                        |
| highlightSuspectLine  | Boolean | true    | highlight the "suspect line" in the dialog            |