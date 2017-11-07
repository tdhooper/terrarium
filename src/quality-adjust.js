var QualityThrottle = require('./quality-throttle');


const QualityAdjust = function(main) {
    this.main = main;
    const qualityRange = 4;
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
    this.main.log.log('Switching quality to ' + quality);
    const lights = this.main.lights;
    const soilCursor = this.main.terrarium.soilCursor;
    switch (quality) {
        case 0:
            soilCursor.setRenderOnTop(true);
            lights.setShadows(lights.SHADOW_OPTIONS.OFF);
            break;
        case 1:
            soilCursor.setRenderOnTop(true);
            lights.setShadows(lights.SHADOW_OPTIONS.LOW);
            break;
        case 2:
            soilCursor.setRenderOnTop(true);
            lights.setShadows(lights.SHADOW_OPTIONS.HIGH);
            break;
        case 3:
            soilCursor.setRenderOnTop(false);
            lights.setShadows(lights.SHADOW_OPTIONS.HIGH);
            break;
    }
};

module.exports = QualityAdjust;
