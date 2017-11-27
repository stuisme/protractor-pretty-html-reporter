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
     * @param {Boolean} options.isSharded=false - use if using shardOnSpec of multiCapabilities options in protractor
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
        this.dataLocation = path.join(this.options.path, 'data');
        this.destination = path.join(this.options.path, 'report.html');
        this.dataFile = path.join(this.dataLocation, `${process.pid}.js`);

        this.hasWrittenReportFile = false;
    }

    startReporter() {
        Reporter.cleanDirectory(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.imageLocation);
        Reporter.makeDirectoryIfNeeded(this.dataLocation);

        this.timer.started = Reporter.nowString();
    }

    stopReporter() {
        this.writeDataFile();

        if (this.hasWrittenReportFile) {
            return;
        }

        let resultContents = fs.readdirSync(this.dataLocation).map(file => {
            return `<script src="data/${file}"></script>`;
        }).join('\n');

        let results = fileContents.replace('<!-- inject::scripts -->', resultContents);
        fs.writeFileSync(this.destination, results, 'utf8');

        this.hasWrittenReportFile = true;
    }

    jasmineStarted(suiteInfo) {

        if (!this.options.isSharded) {
            this.startReporter();
        }

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
        if (this.currentSpec.status !== "disabled" && this.currentSpec.status !== "pending" && (this.currentSpec.status !== 'passed' || this.options.screenshotOnPassed)) {
            this.currentSpec.screenshotPath = `img/${process.pid}-${this.counts.specs}.png`;
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
        this.stopReporter();
    };

    setOptions(options) {
        this.options = Object.assign(this.options, options);
    };

    writeDataFile() {
        let logEntry = {
            options: this.options,
            timer: this.timer,
            counts: this.counts,
            sequence: this.sequence
        };

        let json = JSON.stringify(logEntry, null, !this.options.debugData ? null : 4);

        fs.writeFileSync(this.dataFile, `window.RESULTS.push(${json});`, 'utf8');
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

    consolidateReports() {
        let parts = this.options.path.split('/');
        let targetDirectory = this.options.path.split(parts[parts.length - 1])[0];
        let reporterDirectory = parts[parts.length - 1].split(/[^a-zA-Z]+/g)[0];
        let fs = require('fs');
        let output = null;
        let times = 0;
        let data;
        let img;
        let allData = null;
        let firstjs = null;
        let allSequences = null;

        if (!fs.existsSync(targetDirectory + 'data')) {
            fs.mkdirSync(targetDirectory + 'data');
        }
        if (!fs.existsSync(targetDirectory + 'img')) {
            fs.mkdirSync(targetDirectory + 'img');
        }

        fs.readdirSync(targetDirectory).forEach(function (file) {

            if (file.includes(reporterDirectory)) {

                if (!(fs.lstatSync(targetDirectory + file + '/report.html').isDirectory())) {
                    fs.readdirSync(targetDirectory + file + '/data').forEach(function (filejs) {
                        let currentDataBuffer = fs.readFileSync(targetDirectory + file + '/data/' + filejs, 'utf8');
                        let currentData = JSON.parse(currentDataBuffer.slice(20, (currentDataBuffer.length - 2)));

                        if (allData == null) {
                            allData = currentData;
                            firstjs = filejs;
                            allData.sequence.forEach(data => {
                                data.times = 1;
                                data.successTimes = 0;
                                if (data.status === 'passed') {
                                    data.successTimes++;
                                }
                                let deepCopySpecs = JSON.parse(JSON.stringify(data));
                                data.allSpecs = [deepCopySpecs];
                            });
                        } else {
                            allData.timer.duration += currentData.timer.duration;
                            allData.counts.specs += currentData.counts.specs;
                            allData.counts.passed += currentData.counts.passed;
                            allData.counts.failed += currentData.counts.failed;
                            allData.counts.pending += currentData.counts.pending;

                            allData.sequence.forEach(function (allDataOneSequence) {
                                currentData.sequence.forEach(function (currentDataOneSequence) {
                                    if (allDataOneSequence.description === currentDataOneSequence.description && allDataOneSequence.status != 'disabled') {

                                        allDataOneSequence.times++;
                                        if (currentDataOneSequence.status === 'passed') {
                                            allDataOneSequence.successTimes++;
                                            allDataOneSequence.status = 'passed';
                                        }
                                        allDataOneSequence.allSpecs = allDataOneSequence.allSpecs.concat(currentDataOneSequence);
                                        return;
                                    }
                                });
                            });
                        }
                    });
                    fs.readdirSync(targetDirectory + file + '/img').forEach(function (img) {
                        let readStream = fs.createReadStream(targetDirectory + file + '/img/' + img);
                        readStream.pipe(fs.createWriteStream(targetDirectory + 'img/' + img));
                    });
                }
                if (output == null) {
                    output = fs.readFileSync('node_modules/macedonia-protractor-reporter/consolidatedreport.html');
                }
                times++;
            }
        });
        fs.writeFileSync(targetDirectory + 'ConsolidatedReport.html', output, 'utf8');
        var dataInString = 'window.RESULTS.push(' + JSON.stringify(allData) + ');';
        fs.writeFileSync(targetDirectory + 'data/1.js', dataInString, 'utf8');
    }
}

module.exports = Reporter;
