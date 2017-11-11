var geometryTools = require('./geometry-tools');
var materials = require('./materials');

const Container = function(parent, app, geometry) {
    geometry = geometryTools.wireframeMesh(geometry, .0025);

    const mesh = new THREE.Mesh(geometry, materials.containerWireframe);
    parent.add(mesh);
    this.mesh = mesh;
};

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
