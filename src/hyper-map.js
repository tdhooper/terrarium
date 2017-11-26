const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(easing) {
    this.waveFront = 0;
    this.waveBack = 0;
    this.waveSpeed = 1/3000;
    this.backMove = 0;
    this.materialData = new THREE.Vector2();
};

HyperMap.prototype.addWave = function() {
    if (this.waveBack >= .5) {
        this.waveFront = 0;
        this.waveBack = 0;
        this.backMove = 0;
    } else {
        this.backMove += .1;
    }
};

HyperMap.prototype.update = function(delta) {
    // return;
    delta *= this.waveSpeed;
    this.backMove = THREE.Math.clamp(this.backMove - delta * 1.5, 0, .1);
    this.waveFront += delta;
    this.waveBack += delta - this.backMove;
    this.waveBack = Math.max(-1, this.waveBack);
    // console.log(this.waveFront, this.waveBack, this.backMove);
    this.materialData.set(this.waveFront, this.waveBack);
    // console.log(this.materialData);
};


module.exports = HyperMap;

