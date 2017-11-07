
// How long to put up with sub-optimal performance
const ACCEPTABLE_LAG = 1000;

const RAISE_DELAY = 2000;

// Drop the quality for anything below
// Increase the quality for anything above
const TARGET_FPS_RANGE = [30, 40];


var QualityThrottle = function(qualityRange, initialQuality, callback) {
    this.callback = callback;

    this.lastTime = (performance || Date).now();
    this.frames = 0;

    this.lastLower = 0;

    this.qualityRange = qualityRange;
    this.quality = initialQuality;
};

QualityThrottle.prototype.update = function() {
    this.frames += 1;
    const time = (performance || Date).now();
    if (time >= this.lastTime + ACCEPTABLE_LAG) {
        const fps = (this.frames * 1000) / (time - this.lastTime);
        this.lastTime = time;
        this.frames = 0;
        this.throttle(fps);
    }
};

QualityThrottle.prototype.throttle = function(fps) {
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

module.exports = QualityThrottle;
