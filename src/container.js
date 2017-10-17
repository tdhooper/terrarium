var THREE = require('three');

var Container = function(scene, eventMediator, TWEEN) {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    material.wireframe = true;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    mesh.scale.set(.001,.001,.001);
    const inTween = new TWEEN.Tween(mesh.scale)
        .to({x: 1, y: 1, z: 1}, 1250)
        .easing(TWEEN.Easing.Cubic.Out);

    mesh.rotation.y = 0;
    const spinTween = new TWEEN.Tween(mesh.rotation)
        .to({y: Math.PI}, 1500)
        .easing(TWEEN.Easing.Cubic.Out);

    eventMediator.on('start', function() {
        inTween.start();
        spinTween.start();
    });
};

module.exports = Container;
