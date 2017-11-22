const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(easing) {
    // this.easing = TWEEN.Easing.Quadratic.In;
    this.easing = x => Math.pow(x, 2);
    this.easing = x => x;
    this.waves = [0, -1, -2, -3, -4, -5, -6, -7, -8, -9];
    this.waves = [];
    this.wavelengthStart = .1;
    this.wavelengthEnd = .75;
    this.waveDuration = 3000; // milliseconds
    this.wavePower = 1;
    const waveResolution = 12;
    this.size = THREE.Math.ceilPowerOfTwo(
        waveResolution / Math.min(this.wavelengthStart, this.wavelengthEnd)
    );
    this.amount = this.size * 4;
    this.data = new Uint8Array(this.amount);
    for (var i = 0; i < this.amount; i++) {
        this.data[i] = 0;
    }
    this.dataTexture = new THREE.DataTexture(this.data, this.size, 1, THREE.AlphaFormat, THREE.UnsignedByteType);
    this.dataTexture.needsUpdate = true;
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
    var x, value, offset, wavelength, waveX;
    for (var i = 0; i < this.size; i++) {
        x = i / (this.size - 1);
        x = Math.pow(x, 4);
        value = 0;
        for (var w = 0; w < numWaves; w++) {
            offset = this.waves[w];
            if (offset > 0 && offset <= 1) {
                offset = this.easing(offset);
                wavelength = THREE.Math.lerp(
                    this.wavelengthStart,
                    this.wavelengthEnd,
                    offset
                );
                waveX = x - offset + wavelength * (1 - offset);
                waveX = Math.max(waveX / wavelength, 0);
                waveX = waveX > 1 ? 0 : waveX;
                value += this.waveShape(waveX) * this.wavePower;
            }
        }
        this.data[i] = Math.min(value, 1) * 255;
    }
    this.dataTexture.needsUpdate = true;
};

HyperMap.prototype.waveShape = function(x) {
    return x;
    return THREE.Math.smoothstep(x, 0, .75) - THREE.Math.smoothstep(x, .75, 1);
};


module.exports = HyperMap;
