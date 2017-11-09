const THREE = require('./lib/three');


const Lights = function(parent) {

    const lights = new THREE.Group();
    this.object = lights;

    const sunPosition = new THREE.Vector3(-1, 2, 0);

    const skyLight = new THREE.HemisphereLight(
        0xfafaff,
        0xc0cfee,
        1
    );
    skyLight.position.set(-2, 0, 0);
    lights.add(skyLight);

    this.shadowLights = {};

    const light = new THREE.PointLight(0xffffc0, .1);
    light.position.copy(sunPosition);
    lights.add(light);
    this.shadowLights[this.SHADOW_OPTIONS.OFF] = light;

    const lightLow = light.clone();
    lightLow.castShadow = true;
    lightLow.shadow.mapSize.width = 256;
    lightLow.shadow.mapSize.height = 256;
    lights.add(lightLow);
    this.shadowLights[this.SHADOW_OPTIONS.LOW] = lightLow;

    const lightHigh = light.clone();
    lightHigh.castShadow = true;
    lightHigh.shadow.mapSize.width = 1024;
    lightHigh.shadow.mapSize.height = 1024;
    lights.add(lightHigh);
    this.shadowLights[this.SHADOW_OPTIONS.HIGH] = lightHigh;

    parent.add(lights);
};

Lights.prototype.SHADOW_OPTIONS = {
    OFF: 'off',
    LOW: 'low',
    HIGH: 'high'
};

Lights.prototype.setRotation = function(rotation) {
    this.object.setRotationFromEuler(rotation);
};

Lights.prototype.setShadows = function(option) {
    Object.entries(this.shadowLights).forEach(entry => {
        if (entry[0] === option) {
            entry[1].visible = true;
        } else {
            entry[1].visible = false;
        }
    });
};

module.exports = Lights;
