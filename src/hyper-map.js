const TWEEN = require('@tweenjs/tween.js');


const HyperMap = function(eventMediator) {
    this.eventMediator = eventMediator;
    // this.waves = [.1, -1, -2, -3, -4];
    this.waves = [];
    this.waveDuration = 3; // seconds
    this.wavePower = .75;
    this.dataTexture = [0,0,0,0];
    this.tapSpeed = 0;
    this.lastTap = 0;

    eventMediator.on('update', delta => {
        if (delta) {
            this.update(delta);
        }
    });
};

HyperMap.prototype.addWave = function() {
    var tap = Date.now();
    var delta = tap - this.lastTap;
    this.tapSpeed = Math.max(0, 500 - delta) / 500;
    this.lastTap = tap;
    if (this.waves.length < this.dataTexture.length) {
        this.waves.unshift(0);
    }
};

HyperMap.prototype.update = function(delta) {
    delta /= this.waveDuration;
    var fullOn = 0;
    this.waves = this.waves
        .map(wave => {
            if (
                this.tapSpeed > .5 &&
                wave > .2 &&
                wave < .35
            ) {
                return .25;
            }
            return wave + delta;
        })
        .filter(wave => {
            if (
                wave > .2 &&
                wave < .35
            ) {
                fullOn += 1;
                if (fullOn > 2) {
                    return false;
                }
            }
            return true;
        })
        .filter(wave => wave <= 1);
    var power = 0;
    var wave;
    this.dataTexture.forEach((v, i) => {
        wave = i < this.waves.length ? this.waves[i] : 0;
        this.dataTexture[i] = wave;
        wave = Math.min(1, wave * 1.5);
        power += (Math.sin(wave * Math.PI * 2 - Math.PI * .5) * .5 + .5) * .75;
    });
    this.publishPower(Math.min(1, power));
    this.tapSpeed *= .9;
};

HyperMap.prototype.publishPower = function(power) {
    if (power !== this.power) {
        this.eventMediator.emit('hyper-power', power);
    }
    this.power = power;
};

module.exports = HyperMap;
