const THREE = require('three');


const ContainerGeometry = function() {
    var geometry = new THREE.IcosahedronGeometry(1, 1);
    geometry.computeFlatVertexNormals();
    return geometry;
};

module.exports = ContainerGeometry;
