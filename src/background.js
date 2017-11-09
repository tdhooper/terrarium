const THREE = require('three');


const Background = function(parent, app, geometry) {

    const material = new THREE.MeshBasicMaterial({
        color: 0x322f57,
        side: THREE.BackSide,
        depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    this.mesh = mesh;
};

Background.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Background;
