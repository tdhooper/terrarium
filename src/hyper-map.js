const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(easing) {
    this.waves = [];
    this.waveDuration = 3000; // milliseconds
    this.wavePower = .75;
    this.dataTexture = new THREE.Matrix3();
};

HyperMap.prototype.addWave = function() {
    this.waves.unshift(0);
};

HyperMap.prototype.update = function(delta) {
    delta /= this.waveDuration;
    this.waves = this.waves
        .map(wave => wave + delta)
        .filter(wave => wave <= 1);
    this.dataTexture.elements = this.dataTexture.elements.map((v, i) => {
        return i < this.waves.length ? this.waves[i] : 0;
    });
};


module.exports = HyperMap;
