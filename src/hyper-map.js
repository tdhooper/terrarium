
const HyperMap = function() {
    this.size = 16;
    this.amount = this.size * 4;
    this.data = new Uint8Array(this.amount);
    this.dataTexture = new THREE.DataTexture(this.data, this.size, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.dataTexture.magFilter = THREE.LinearFilter;
};

HyperMap.prototype.set = function(value) {
    for (var i = 0; i < this.amount; i++) {
        this.data[i] = (i / this.amount) * 256 * 4;
    }
    this.dataTexture.needsUpdate = true;
};

module.exports = HyperMap;
