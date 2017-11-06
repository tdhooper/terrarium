var QualityThrottle = require('./quality-throttle');


const QUALITY = {
    HIGH: 'high',
    LOW: 'low'
};

const FPS_QUALITY = {
    0: QUALITY.LOW,
    40: QUALITY.HIGH
};

const QualityAdjust = function(app) {
    this.app = app;
    const initial = QUALITY.HIGH;
    this.adjust(initial);
    this.throttle = new QualityThrottle(
        FPS_QUALITY,
        initial,
        this.adjust.bind(this)
    );
};

QualityAdjust.prototype.update = function() {
    this.throttle.update();
};

QualityAdjust.prototype.adjust = function(quality) {
    this.app.log.log('Switching quality to ' + quality);
    switch (quality) {
        case QUALITY.HIGH:
            this.app.renderer.shadowMap.enabled = true;
            break;
        case QUALITY.LOW:
            this.app.renderer.shadowMap.enabled = false;
            break;
    }
};

module.exports = QualityAdjust;
