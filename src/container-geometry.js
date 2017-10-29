const THREE = require('three');


const ContainerGeometry = function() {
    // return new THREE.BoxGeometry(1, 1, 1);
    return new THREE.IcosahedronGeometry(1, 1);
};

module.exports = ContainerGeometry;
