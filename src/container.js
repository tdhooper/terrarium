const THREE = require('three');

const Soil = require('./soil.js');


const Container = function(parent, app) {
    const group = new THREE.Group();
    parent.add(group);

    const geometry = new THREE.IcosahedronGeometry(1, 1);
    geometry.computeFlatVertexNormals();

    const material = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    material.wireframe = true;

    const mesh = new THREE.Mesh(geometry, material);

    group.add(mesh);

    const soil = new Soil(group, geometry, app);

    // Animations

    const TWEEN = app.TWEEN;

    group.scale.set(.001,.001,.001);
    const inTween = new TWEEN.Tween(group.scale)
        .to({x: 1, y: 1, z: 1}, 1250)
        .easing(TWEEN.Easing.Cubic.Out);

    group.rotation.y = 0;
    const spinTween = new TWEEN.Tween(group.rotation)
        .to({y: Math.PI}, 1500)
        .easing(TWEEN.Easing.Cubic.Out);

    app.eventMediator.on('start', function() {
        inTween.start();
        spinTween.start();
    });
};

module.exports = Container;
