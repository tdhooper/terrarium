var QualityThrottle = require('./quality-throttle');


const QualityAdjust = function(main) {
    this.main = main;
    this.qualityRange = 5;
    this.initialQuality = this.qualityRange - 1;
    this.adjust(this.initialQuality);
};

QualityAdjust.prototype.enable = function() {
    this.throttle = new QualityThrottle(
        this.qualityRange,
        this.initialQuality,
        this.adjust.bind(this)
    );
};

QualityAdjust.prototype.update = function() {
    this.throttle && this.throttle.update();
};

QualityAdjust.prototype.adjust = function(quality) {
    quality = 4;
    this.main.log.log('Switching quality to ' + quality);

    const lights = this.main.lights;
    const soilCursor = this.main.terrarium.soilCursor;
    switch (quality) {
        case 0:
            this.main.setPixelRatio(window.devicePixelRatio * .25);
            soilCursor.setRenderOnTop(true);
            lights.setShadows(lights.SHADOW_OPTIONS.LOW);
            break;
        case 1:
            this.main.setPixelRatio(window.devicePixelRatio * .5);
            soilCursor.setRenderOnTop(true);
            lights.setShadows(lights.SHADOW_OPTIONS.LOW);
            break;
        case 2:
            this.main.setPixelRatio(window.devicePixelRatio * .75);
            soilCursor.setRenderOnTop(false);
            lights.setShadows(lights.SHADOW_OPTIONS.LOW);
            break;
        case 3:
            this.main.setPixelRatio(window.devicePixelRatio);
            soilCursor.setRenderOnTop(false);
            lights.setShadows(lights.SHADOW_OPTIONS.LOW);
            break;
        case 4:
            this.main.setPixelRatio(window.devicePixelRatio);
            soilCursor.setRenderOnTop(false);
            lights.setShadows(lights.SHADOW_OPTIONS.MEDIUM);
            break;
        case 5:
            this.main.setPixelRatio(window.devicePixelRatio);
            soilCursor.setRenderOnTop(false);
            lights.setShadows(lights.SHADOW_OPTIONS.HIGH);
            break;
    }
};

module.exports = QualityAdjust;
