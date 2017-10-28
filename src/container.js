const THREE = require('three');


const Container = function(parent, app) {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    geometry.computeFlatVertexNormals();

    const material = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    material.wireframe = true;

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    this.geometry = geometry;
    this.mesh = mesh;
};

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
