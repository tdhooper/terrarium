const THREE = require('three');
const crystalGen = require('crystal-gen');


const Crystal = function(parent, app, position, normal) {
    this.app = app;

    this.idealNormals = {};
    this.position = position;
    this.normal = normal;

    const geometry = this.createGeometry();
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    const rotation = Math.random();
    mesh.up = new THREE.Vector3(
        Math.sin(rotation),
        0,
        Math.cos(rotation)
    );

    this.mesh = mesh;
    this.id = mesh.id;

    mesh.position.copy(position);
    this.setDirection(normal);

    var TWEEN = app.TWEEN;
    this.mesh.scale.set(.25, .25, 0);
    this.growTween = new TWEEN.Tween(this.mesh.scale)
        .to({x: 1, y: 1, z: 1}, 1500)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function(value, progress) {
            app.eventMediator.emit('crystal.growth', progress);
        })
        .start();
};

Crystal.prototype.setDirection = function(normal, animate) {
    if (this.directionTween) {
        this.directionTween.stop();
    }
    var vector = this.position.clone().add(normal);
    if (animate) {
        var matrix = new THREE.Matrix4();
        matrix.lookAt(vector, this.mesh.position, this.mesh.up);
        const qEnd = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const qStart = this.mesh.quaternion.clone();
        const time = {t: 0};
        this.directionTween = new this.app.TWEEN.Tween(time)
            .to({t: 1}, 1000)
            .easing(this.app.TWEEN.Easing.Quadratic.Out)
            .onUpdate((time) => {
                THREE.Quaternion.slerp(qStart, qEnd, this.mesh.quaternion, time.t);
            })
            .start();
    } else {
        this.mesh.lookAt(vector);
    }
};

Crystal.prototype.createGeometry = function() {
    const geometry = crystalGen.create({
        sides: 5,
        diameter: .125,
        height: 1.25,
        topSlope: .7,
        topFacets: 3,
        topScale: 1.5,
        seed: Math.random()
    });
    return geometry;
};

Crystal.prototype.stopGrowth = function() {
    this.growTween.stop();
};

module.exports = Crystal;
