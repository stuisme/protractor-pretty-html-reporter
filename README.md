# protractor pretty html reporter
[![Build Status](https://travis-ci.org/stuisme/protractor-pretty-html-reporter.svg?branch=master)](https://travis-ci.org/stuisme/protractor-pretty-html-reporter)
[![Latest Version](https://img.shields.io/github/tag/stuisme/protractor-pretty-html-reporter.svg)](https://github.com/stuisme/protractor-pretty-html-reporter)
[![NPM Version](https://img.shields.io/npm/v/protractor-pretty-html-reporter.svg)](https://npmjs.org/package/protractor-pretty-html-reporter)
[![NPM Monthly Downloads](https://img.shields.io/npm/dm/protractor-pretty-html-reporter.svg)](https://npmjs.org/package/protractor-pretty-html-reporter)

```
npm i protractor-pretty-html-reporter --save-dev
```
_NOTE: jasmine is set as a peer dependency_

### Basic Setup

protractor.conf
```
var PrettyReporter = require('protractor-pretty-html-reporter').Reporter;

var prettyReporter = new PrettyReporter({

    // required, there is no default
    path: path.join(__dirname, 'results'),

    // includes browser icon in the output
    // defaults to true
    showBrowser: true,

    // includes screen shots for tests that pass
    // failures are always included
    // defaults to false
    screenshotOnPassed: false

});

module.exports = {
    /* the rest of the object omitted */
    onPrepare: function() {
        jasmine.getEnv().addReporter(prettyReporter);
    }
};
```