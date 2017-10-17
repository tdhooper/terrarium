var THREE = require('three');


var Container = function(scene) {
    var geometry = new THREE.IcosahedronGeometry(2);
    var material = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    material.wireframe = true;
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

module.exports = Container;
