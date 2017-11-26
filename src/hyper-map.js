const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(easing) {
    // this.waves = [.1, -1, -2, -3, -4];
    this.waves = [];
    this.waveDuration = 3000; // milliseconds
    this.wavePower = .75;
    this.dataTexture = [0,0,0,0];
};

HyperMap.prototype.addWave = function() {
    if (this.waves.length < this.dataTexture.length) {
        this.waves.unshift(0);
    }
};

HyperMap.prototype.update = function(delta) {
    // return;
    delta /= this.waveDuration;
    this.waves = this.waves
        .map(wave => wave + delta)
        .filter(wave => wave <= 1);
    this.dataTexture.forEach((v, i) => {
        this.dataTexture[i] = i < this.waves.length ? this.waves[i] : 0;
    });
};


module.exports = HyperMap;
