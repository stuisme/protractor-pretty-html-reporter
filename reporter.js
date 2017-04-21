'use strict';

const fs = require('fs');
const path = require('path');

//path setup
const templatePath = path.join(__dirname, 'report.html');
const fileContents = fs.readFileSync(templatePath).toString();

/** A jasmine reporter that produces an html report **/
class Reporter {

    /**
     * @constructor
     * @param {Object} options - options for the reporter
     * @param {String} options.path - Path the report.html will be written to
     * @param {Boolean} options.screenshotOnPassed=false - take screenshots for passing tests too
     * @param {Boolean} options.writeReportEachSpec=true - write the report between each spec, recommended for long running tests
     * @param {Boolean} options.showBrowser=true - show browser icon on the overview
     * @param {Boolean} options.highlightSuspectLine=true - highlight the "suspect line" in the detail dialog
     */
    constructor(options) {
        this.sequence = [];
        this.counts = {specs: 0};
        this.timer = {};
        this.currentSpec = null;
        this.browserLogs = [];

        this.options = Reporter.getDefaultOptions();
        this.setOptions(options);

        if (!this.options.path) {
            throw new Error('Please provide options.path')
        }

        this.imageLocation = path.join(this.options.path, 'img');
        this.destination = path.join(this.options.path, 'report.html');

    }

    jasmineStarted(suiteInfo) {
        // clean up existing report
        Reporter.cleanDirectory(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.imageLocation);

        this.timer.started = Reporter.nowString();

        afterEach((next) => {
            this.currentSpec.stopped = Reporter.nowString();
            this.currentSpec.duration = new Date(this.currentSpec.stopped) - new Date(this.currentSpec.started);
            this.currentSpec.prefix = this.currentSpec.fullName.replace(this.currentSpec.description, '');

            browser.takeScreenshot()
                .then((png) => {
                    this.currentSpec.base64screenshot = png;
                })
                .then(browser.getCapabilities)
                .then((capabilities) => {
                    this.currentSpec.browserName = capabilities.get('browserName');
                    return browser.manage().logs().get('browser');
                })
                .then((browserLogs) => {
                    this.currentSpec.browserLogs = browserLogs;
                    this.browserLogs.concat(browserLogs);
                })
                .then(next, next);
        });
    };

    suiteStarted(result) {
    };

    specStarted(result) {
        this.counts.specs++;
        this.currentSpec = result;
        this.currentSpec.started = Reporter.nowString();
    };

    specDone(result) {
        this.counts[this.currentSpec.status] = (this.counts[this.currentSpec.status] || 0) + 1;
        this.sequence.push(this.currentSpec);

        // Handle screenshot saving
        if (this.currentSpec.status !== "disabled"  && this.currentSpec.status !== "pending"  && (this.currentSpec.status !== 'passed' || this.options.screenshotOnPassed)) {
            this.currentSpec.screenshotPath = 'img/' + this.counts.specs + '.png';
            this.writeImage(this.currentSpec.base64screenshot);
        }

        // remove this from the payload that is written to report.html;
        delete this.currentSpec.base64screenshot;

        // suspectLine
        result.failedExpectations.forEach(failure => {
            failure.hasSuspectLine = failure.stack.split('\n').some(function (line) {
                let match = line.indexOf('Error:') === -1 && line.indexOf('node_modules') === -1;

                if (match) {
                    failure.suspectLine = line;
                }

                return match;
            });
        });

        if (this.options.writeReportEachSpec) {
            this.jasmineDone();
        }
    };

    suiteDone(result) {
    };

    jasmineDone() {
        this.timer.stopped = Reporter.nowString();
        this.timer.duration = new Date(this.timer.stopped) - new Date(this.timer.started);
        this.writeFile();
    };

    setOptions(options) {
        this.options = Object.assign(this.options, options);
    };

    writeFile() {
        let logEntry = {
            options: this.options,
            timer: this.timer,
            counts: this.counts,
            sequence: this.sequence
        };

        let results = fileContents.replace('\'<Results Replacement>\'', JSON.stringify(logEntry, null, 4));
        fs.writeFileSync(this.destination, results, 'utf8');
    }

    writeImage(img) {
        let stream = fs.createWriteStream(path.join(this.options.path, this.currentSpec.screenshotPath));
        stream.write(new Buffer(img, 'base64'));
        stream.end();
    }

    static getDefaultOptions() {
        return {
            screenshotOnPassed: false,
            writeReportEachSpec: true,
            showBrowser: true,
            highlightSuspectLine: true
        };
    }

    static cleanDirectory(dirPath) {
        let files = [];
        try {
            files = fs.readdirSync(dirPath);
        }
        catch (e) {
            return;
        }
        if (files.length > 0)
            for (let i = 0; i < files.length; i++) {
                let filePath = dirPath + '/' + files[i];

                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                } else {
                    Reporter.cleanDirectory(filePath);
                }
            }
        fs.rmdirSync(dirPath);
    }

    static makeDirectoryIfNeeded(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    static nowString() {
        return (new Date()).toISOString();
    }
}

module.exports = Reporter;
