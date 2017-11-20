
const HyperMap = function() {
    const size = 16;
    this.amount = size * 4;
    this.data = new Uint8Array(this.amount);
    this.dataTexture = new THREE.DataTexture(this.data, size, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
};

HyperMap.prototype.set = function(value) {
    for (var i = 0; i < this.amount; i++) {
        this.data[i] = value * 255;
    }
    this.dataTexture.needsUpdate = true;
};

module.exports = HyperMap;
