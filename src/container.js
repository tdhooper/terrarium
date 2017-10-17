var THREE = require('three');

var Container = function(scene, eventMediator, TWEEN) {
    var geometry = new THREE.IcosahedronGeometry(1, 1);
    var material = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    material.wireframe = true;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(.01,.01,.01);
    scene.add(this.mesh);

    this.inTween = new TWEEN.Tween(this.mesh.scale);
    this.inTween.to({x: 1, y: 1, z: 1}, 1000);

    const start = this.inTween.start.bind(this.inTween);
    eventMediator.on('start', start);
};

module.exports = Container;
