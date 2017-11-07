const THREE = require('three');

var geometryTools = require('./geometry-tools');


const Container = function(parent, app, geometry) {
    geometry = geometryTools.wireframeMesh(geometry, .0025);
    var material = new THREE.MeshBasicMaterial({
        color: 0x888888
    });
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    this.mesh = mesh;
};

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
