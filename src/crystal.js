const THREE = require('three');


const Crystal = function(parent, app, position, top) {
    const geometry = this.createGeometry();
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    parent.add(mesh);

    mesh.position.copy(position);
    mesh.lookAt(top);

    this.mesh = mesh;

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

Crystal.prototype.createGeometry = function() {
    const width = .2;
    const height = 1;
    const geometry = new THREE.BoxGeometry(width, width, height);
    geometry.translate(0, 0, height / 2);
    return geometry;
};

Crystal.prototype.stopGrowth = function() {
    this.growTween.stop();
};

module.exports = Crystal;
