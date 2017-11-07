var QualityThrottle = require('./quality-throttle');


const QualityAdjust = function(app) {
    this.app = app;
    const qualityRange = 2;
    const initialQuality = 1;
    this.adjust(initialQuality);
    this.throttle = new QualityThrottle(
        qualityRange,
        initialQuality,
        this.adjust.bind(this)
    );
};

QualityAdjust.prototype.update = function() {
    this.throttle.update();
};

QualityAdjust.prototype.adjust = function(quality) {
    this.app.log.log('Switching quality to ' + quality);
    switch (quality) {
        case 0:
            this.app.main.shadowLightHigh.visible = false;
            this.app.main.shadowLightLow.visible = true;
            break;
        case 1:
            this.app.main.shadowLightHigh.visible = true;
            this.app.main.shadowLightLow.visible = false;
            break;
    }
};

module.exports = QualityAdjust;
