const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(easing) {
    this.easing = TWEEN.Easing.Quadratic.Out;
    this.waves = [];
    this.wavelength = 1;
    this.waveDuration = 1000; // milliseconds
    const waveResolution = 12;
    this.size = THREE.Math.ceilPowerOfTwo(waveResolution / this.wavelength);
    this.amount = this.size * 4;
    this.data = new Uint8Array(this.amount);
    for (var i = 0; i < this.amount; i++) {
        this.data[i] = 0;
    }
    this.dataTexture = new THREE.DataTexture(this.data, this.size, 1, THREE.AlphaFormat, THREE.UnsignedByteType);
    this.dataTexture.magFilter = THREE.LinearFilter;
    // this.updateTexture();
};

HyperMap.prototype.addWave = function() {
    this.waves.push(0);
};

HyperMap.prototype.update = function(delta) {
    // return;
    delta /= this.waveDuration;
    this.waves = this.waves
        .map(wave => wave + delta)
        .filter(wave => wave <= 1);
    this.updateTexture();
};

HyperMap.prototype.updateTexture = function() {
    const numWaves = this.waves.length;
    var x, value, offset, waveX;
    for (var i = 0; i < this.size; i++) {
        x = i / (this.size - 1);
        value = 0;
        for (var w = 0; w < numWaves; w++) {
            offset = this.easing(this.waves[w]);
            waveX = x - offset + this.wavelength * (1 - offset);
            waveX = THREE.Math.clamp(waveX / this.wavelength, 0, 1);
            waveX = waveX === 1 ? 0 : waveX;
            value += this.waveShape(waveX);
        }
        this.data[i] = Math.min(value, 1) * 255;
    }
    this.dataTexture.needsUpdate = true;
};

HyperMap.prototype.waveShape = function(x) {
    return THREE.Math.smoothstep(x, 0, .75) - THREE.Math.smoothstep(x, .75, 1);
};


module.exports = HyperMap;
