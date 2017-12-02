const crystalGen = require('./crystal-gen');
const genRandom = require('random-seed');


const Crystal = function(parent, app, position, normal, material) {
    this.app = app;
    this.parent = parent;

    this.idealNormals = {};
    this.position = position;
    this.normal = normal;

    const seed = Math.random();

    this.material = material.clone();
    this.material.uniforms.seed.value = seed;

    const geometry = this.createGeometry(seed);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;

    const group = new THREE.Group();
    group.add(mesh);
    parent.add(group);

    const rotation = Math.random();
    group.up = new THREE.Vector3(
        Math.sin(rotation),
        0,
        Math.cos(rotation)
    );

    this.mesh = mesh;
    this.group = group;
    this.id = mesh.id;

    group.position.copy(position);
    this.setDirection(normal);

    geometry.computeBoundingSphere();
    const bounding = geometry.boundingSphere;
    this.height = bounding.radius * 2;

    const TWEEN = app.TWEEN;

    var stop = 0;
    const initial = {t: 0};
    const size = {t: 0};
    const minSize = .2;

    const initialTween = new TWEEN.Tween(initial)
        .to({t: minSize}, 500)
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .onComplete(() => {
            stop += 1;
        });

    this.growTween = new TWEEN.Tween(size)
        .to({t: 1}, 5000)
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .onUpdate((object, progress) => {
            app.eventMediator.emit('crystal.growth', progress);
        }).onComplete(() => {
            stop += 1;
        }).onStop(() => {
            stop += 1;
        });

    const combinedTween = new TWEEN.Tween({t: 0})
        .to({t: 1}, 1)
        .repeat(Infinity)
        .onUpdate(() => {
            if (stop >= 2) {
                combinedTween.stop();
                return;
            }
            this.setSize(initial.t + size.t * (1 - minSize));
        });

    // initialTween.start();
    // this.growTween.start();
    // combinedTween.start();
};

Crystal.prototype.setSize = function(size) {
    const sink = .01;
    var scale = THREE.Math.lerp(.2, 1, this.app.TWEEN.Easing.Sinusoidal.In(size));

    var bottomT = THREE.Math.lerp(1, 0, this.app.TWEEN.Easing.Sinusoidal.Out(size));
    var actualHeight = this.height * scale;
    var bottomScale = (actualHeight - sink) * -1 * bottomT - sink;

    this.mesh.scale.set(scale, scale, scale);
    this.mesh.position.set(0, 0, bottomScale);

    this.material.uniforms.bottomClip.value = (this.height - (sink / scale)) * bottomT;
    this.material.uniforms.height.value = actualHeight;
    this.material.uniforms.scale.value = scale;
};

Crystal.prototype.setDirection = function(normal, animate, delay) {
    if (this.directionTween) {
        this.directionTween.stop();
    }
    var vector = this.position.clone().add(normal);
    if (animate) {
        delay = delay || 0;
        var matrix = new THREE.Matrix4();
        matrix.lookAt(vector, this.group.position, this.group.up);
        const qEnd = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const qStart = this.group.quaternion.clone();
        const time = {t: 0};
        this.directionTween = new this.app.TWEEN.Tween(time)
            .to({t: 1}, 750 + delay)
            .easing(this.app.TWEEN.Easing.Quadratic.InOut)
            .onUpdate((time) => {
                THREE.Quaternion.slerp(qStart, qEnd, this.group.quaternion, time.t);
            })
            .delay(delay)
            .start();
    } else {
        this.group.lookAt(vector);
    }
};

Crystal.prototype.createGeometry = function(seed) {
    var spec = {
        sides: 5,
        diameter: .125,
        height: 1.25,
        topSlope: .7,
        topFacets: 3,
        topScale: 1.5
    };
    var rand = genRandom(seed).random;
    const geometry = crystalGen(spec, rand);
    geometry.computeFlatVertexNormals();
    return geometry;
};

Crystal.prototype.stopGrowth = function() {
    this.growTween.stop();
};

Crystal.prototype.destroy = function() {
    this.parent.remove(this.group);
};

Crystal.prototype.restore = function() {
    this.parent.add(this.group);
};

module.exports = Crystal;
