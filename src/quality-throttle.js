
// How long to put up with sub-optimal performance
const ACCEPTABLE_LAG = 1000;

// How many measurements should be taken in the lag window
const LAG_RESOLUTION = 10;

const ALLOW_SWITCHES = 4;


var QualityThrottle = function(FPS_QUALITY, initial, callback) {
    this.callback = callback;

    this.lastUpdate = Date.now();
    this.samples = [];
    this.lagWindow = [];
    this.switchHistory = [];
    this.stopSwitching = false;

    this.quality = initial;

    this.fpsQualityMap = Object.entries(FPS_QUALITY).reverse();
    this.qualityFpsMap = this.fpsQualityMap.reduce((obj, entry) => {
        obj[entry[1]]= entry[0];
        return obj;
    }, {});

    const delay = ACCEPTABLE_LAG / LAG_RESOLUTION;
    this.measure(delay);
};

QualityThrottle.prototype.update = function() {
    const now = Date.now();
    const elapsed = now - this.lastUpdate;
    this.lastUpdate = now;
    const fps = 1000 / elapsed;
    this.samples.push(fps);
};

QualityThrottle.prototype.measure = function(delay) {
    const fps = this.average(this.samples);
    this.samples = [];
    this.lagWindow.push(fps);
    this.lagWindow = this.lagWindow.slice(-LAG_RESOLUTION);

    if (this.lagWindow.length == LAG_RESOLUTION) {
        var windowFps = this.average(this.lagWindow);
        this.throttle(windowFps);
    }

    setTimeout(this.measure.bind(this, delay), delay);
};

QualityThrottle.prototype.throttle = function(fps) {
    var quality = this.qualityForFps(fps);
    if (quality !== this.quality) {
        this.publishSwitch(quality);
    }
};

QualityThrottle.prototype.publishSwitch = function(quality) {
    if (this.stopSwitching) {
        return;
    }
    this.switchHistory.push(quality);
    if (this.switchHistory.length >= ALLOW_SWITCHES) {
        this.stopSwitching = true;
        var sorted = this.switchHistory.slice(-2).sort((a, b) => {
            return this.qualityFpsMap[a] - this.qualityFpsMap[b];
        });
        quality = sorted[0];
        if (quality == this.quality) {
            return;
        }
    }
    this.quality = quality;
    this.callback(this.quality);
};

QualityThrottle.prototype.average = function(values) {
    if ( ! values.length) {
        return 0;
    }
    const total = values.reduce((value, total) => {
        return total + value;
    }, 0);
    return total / values.length;
};

QualityThrottle.prototype.qualityForFps = function(fps) {
    var result = this.fpsQualityMap.find(entry => {
        return fps >= entry[0];
    });
    return result[1];
};

module.exports = QualityThrottle;
