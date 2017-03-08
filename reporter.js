'use strict';

const fs = require('fs');
const path = require('path');

//path setup
const templatePath = path.join(__dirname, 'report.html');
const fileContents = fs.readFileSync(templatePath).toString();


class Reporter {
    constructor(options) {
        this.sequence = [];
        this.counts = {specs: 0};
        this.timer = {};
        this.currentSpec = null;

        this.options = Reporter.getDefaultOptions();
        this.setOptions(options);

        this.imageLocation = path.join(this.options.path, 'img');
        this.destination = path.join(this.options.path, 'report.html');
    }

    jasmineStarted(suiteInfo) {
        // clean up existing report
        Reporter.cleanDirectory(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.imageLocation);

        this.timer.jasmineStart = Reporter.nowString();

        afterEach((next) => {
            this.currentSpec.stoped = Reporter.nowString();

            browser.takeScreenshot()
                .then((png) => {
                    this.currentSpec.base64screenshot = png;
                })
                .then(browser.getCapabilities)
                .then((capabilities) => {
                    this.currentSpec.capabilities = capabilities;
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

        if (this.currentSpec.status !== 'passed' || this.options.screenshotOnPassed) {
            this.currentSpec.screenshotPath = 'img/' + this.counts.specs + '.png';
            this.writeImage(this.currentSpec.base64screenshot);

        }

        // remove this from the payload that is written to report.html;
        delete this.currentSpec.base64screenshot;

        this.jasmineDone();
    };

    suiteDone(result) {
    };

    jasmineDone() {
        this.timer.jasmineDone = Reporter.nowString();
        this.writeFile();
    };

    setOptions(options) {
        this.options = Object.assign(this.options, options);
    };

    writeFile() {
        let logEntry = {
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
            screenshotOnPassed: false
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