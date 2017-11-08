const THREE = require('three');
const crystalGen = require('crystal-gen');


const Crystal = function(parent, app, position, normal, material) {
    this.app = app;
    this.parent = parent;

    this.idealNormals = {};
    this.position = position;
    this.normal = normal;

    const geometry = this.createGeometry();
    const mesh = new THREE.Mesh(geometry, material);
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
    var bounding = geometry.boundingSphere;

    var TWEEN = app.TWEEN;
    var size = {t: 0};

    this.growTween = new TWEEN.Tween(size)
        .to({t: 1}, 5000)
        .onUpdate((object, progress) => {
            var scale = THREE.Math.lerp(0, 1, object.t);
            var bottomScale = bounding.radius * 2 * scale * (1 - TWEEN.Easing.Sinusoidal.Out(object.t));

            this.mesh.scale.set(scale, scale, scale);
            this.mesh.position.set(0, 0, bottomScale * -1);

            app.eventMediator.emit('crystal.growth', progress);
        })
        .start();
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

Crystal.prototype.createGeometry = function() {
    const seed = Math.random();
    const geometry = crystalGen.create({
        sides: 5,
        diameter: .125,
        height: 1.25,
        topSlope: .7,
        topFacets: 3,
        topScale: 1.5,
        seed: seed
    });
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
    console.log(bufferGeometry);
    var seeds = new Float32Array(bufferGeometry.attributes.position.length);
    seeds.fill(seed);
    bufferGeometry.addAttribute('seed', new THREE.BufferAttribute(seeds, 3));
    return bufferGeometry;
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
