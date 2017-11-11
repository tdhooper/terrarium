var materials = require('./materials');


const ContainerBackground = function(parent, app, geometry) {

    const mesh = new THREE.Mesh(geometry, materials.containerBack);
    parent.add(mesh);

    this.mesh = mesh;
};

ContainerBackground.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = ContainerBackground;
