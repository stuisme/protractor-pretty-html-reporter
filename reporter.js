'use strict';

const fs = require('fs');
const path = require('path');

//path setup
const templatePath = path.join(__dirname, 'report.html');
const fileContents = fs.readFileSync(templatePath).toString();


class Reporter {

    constructor(options) {
        this.options = options;
        this._sequence = [];
        this._counts = {specs: 0};
        this._timer = {};
        this._currentSpec = null;

        this._imageLocation = path.join(this.options.path, 'img');

        Reporter.cleanDirectory(this.options.path);

        Reporter.makeDirectoryIfNeeded(this.options.path);
        Reporter.makeDirectoryIfNeeded(this._imageLocation);

        this.destination = path.join(this.options.path, 'report.html');
    }

    jasmineStarted(suiteInfo) {
        this._timer.jasmineStart = Reporter.nowString();

        afterEach ((next) => {
            this._currentSpec.stoped = Reporter.nowString();

            let fileName = this._counts.specs + '.png';
            this._currentSpec.screenshotPath = 'img/' + fileName;

            browser.takeScreenshot()
                .then((png) => {
                    this.writeImage(png);
                })
                .then(browser.getCapabilities)
                .then((capabilities) => {
                    this._currentSpec.capabilities = capabilities;
                })
                .then(next, next);
        });

    };

    suiteStarted(result) {
    };

    specStarted(result) {
        this._counts.specs++;
        this._currentSpec = result;
        this._currentSpec.started = Reporter.nowString();
    };

    specDone(result) {
        this._counts[this._currentSpec.status] = (this._counts[this._currentSpec.status] || 0) + 1;
        this._sequence.push(this._currentSpec);
        this.jasmineDone();
    };

    suiteDone(result) {
    };

    jasmineDone() {
        this._timer.jasmineDone = Reporter.nowString();
        this.writeFile();
    };

    writeFile(){
      let logEntry = {
        timer: this._timer,
        counts: this._counts,
        sequence: this._sequence
      };

      let results = fileContents.replace('\'<Results Replacement>\'', JSON.stringify(logEntry, null, 4));
      fs.writeFileSync(this.destination, results, 'utf8');
    }

    writeImage(img){
        let stream = fs.createWriteStream(path.join(this.options.path, this._currentSpec.screenshotPath));
        stream.write(new Buffer(img, 'base64'));
        stream.end();
    }

    static cleanDirectory(dirPath) {
        try { var files = fs.readdirSync(dirPath); }
        catch(e) { return; }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    Reporter.cleanDirectory(filePath);
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