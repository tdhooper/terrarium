const THREE = require('./lib/three');
var glslify = require('glslify');

var geometryTools = require('./geometry-tools');


const Container = function(parent, app, geometry) {
    geometry = geometryTools.wireframeMesh(geometry, .0025);

    const front = new THREE.Color(0x8e9baf);
    const back = new THREE.Color(0xe0ecff);

    back.lerp(front, .25);

    const material = new THREE.ShaderMaterial({
        vertexShader: glslify('./shaders/container.vert'),
        fragmentShader: glslify('./shaders/container.frag'),
        vertexColors: THREE.VertexColors,
        uniforms: {
            frontColor: {type: 'v3', value: front.toArray()},
            backColor: {type: 'v3', value: back.toArray()}
        }
    });

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    this.mesh = mesh;
};

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
