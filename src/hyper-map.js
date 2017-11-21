
const HyperMap = function() {
    this.waves = [.5];
    this.wavelength = .2;
    const waveResolution = 12;
    this.size = THREE.Math.ceilPowerOfTwo(waveResolution / this.wavelength);
    this.amount = this.size * 4;
    this.data = new Uint8Array(this.amount);
    for (var i = 0; i < this.amount; i++) {
        this.data[i] = 0;
    }
    this.dataTexture = new THREE.DataTexture(this.data, this.size, 1, THREE.AlphaFormat, THREE.UnsignedByteType);
    this.dataTexture.magFilter = THREE.LinearFilter;
    this.update();
};

HyperMap.prototype.update = function() {
    const numWaves = this.waves.length;
    var x, value, offset, waveX;
    for (var i = 0; i < this.size; i++) {
        x = i / (this.size - 1);
        value = 0;
        for (var w = 0; w < numWaves; w++) {
            offset = this.waves[w];
            waveX = x - offset + this.wavelength * (1 - offset);
            waveX = THREE.Math.clamp(waveX / this.wavelength, 0, 1);
            value += Math.sin(waveX * Math.PI * 2 - Math.PI * .5) * .5 + .5;
        }
        this.data[i] = value * 256;
    }
    this.dataTexture.needsUpdate = true;
};


HyperMap.prototype.update2 = function() {
    var x;
    for (var i = 0; i < this.size; i++) {
        x = i / (this.size - 1);
        x = Math.sin( x * Math.PI * 2 - Math.PI * .5) * .5 + .5;
        this.data[i] = Math.round(x * 255);
    }
    console.log(this.data);
    this.dataTexture.needsUpdate = true;
};



module.exports = HyperMap;
