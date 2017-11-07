
// How long to put up with sub-optimal performance
const ACCEPTABLE_LAG = 1000;

// How many measurements should be taken in the lag window
const LAG_RESOLUTION = 10;

const ALLOW_SWITCHES = 4;

const RAISE_DELAY = 2000;

// Drop the quality for anything below
// Increase the quality for anything above
const TARGET_FPS_RANGE = [30, 50];


var QualityThrottle = function(qualityRange, initialQuality, callback, log) {
    this.callback = callback;

    this.lastUpdate = Date.now();
    this.samples = [];
    this.lagWindow = [];
    this.lastLower = 0;

    this.qualityRange = qualityRange;
    this.quality = initialQuality;

    const delay = ACCEPTABLE_LAG / LAG_RESOLUTION;
    this.measure(delay);

    this.log = log;
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
    this.log.clear();
    this.log.log(fps);
    if (fps < TARGET_FPS_RANGE[0]) {
        this.lowerQuality();
    } else if (fps > TARGET_FPS_RANGE[1]) {
        this.raiseQuality();
    }
};

QualityThrottle.prototype.lowerQuality = function() {
    this.lastLower = Date.now();
    const quality = Math.max(this.quality - 1, 0);
    if (quality !== this.quality) {
        this.quality = quality;
        this.callback(quality);
    }
};

QualityThrottle.prototype.raiseQuality = function() {
    if (Date.now() < this.lastLower + RAISE_DELAY) {
        return;
    }
    const quality = Math.min(this.quality + 1, this.qualityRange - 1);
    if (quality !== this.quality) {
        this.quality = quality;
        this.callback(quality);
    }
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

module.exports = QualityThrottle;
