const THREE = require('three');
var glslify = require('glslify');

var geometryTools = require('./geometry-tools');


const Container = function(parent, app, geometry) {
    geometry = geometryTools.wireframeMesh(geometry, .001);
    var material = new THREE.MeshBasicMaterial({
        color: 0x888888
    });

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    this.mesh = mesh;

    var points = [
        [0, 0, 0],
        [.8, 0, 0],
        [1.8, 1, 0],
        [1.8, 1.5, 0],
        [1, 2, 0]
    ];

    var positions = points.reduce((acc, point) => {
        return acc.concat(
            point,
            point
            // [point[0], point[1], point[2] + .2]
        );
    }, []);

    var indices = [];

    for (var i = 1; i < points.length; i++) {
        var s = (i - 1) * 2;
        var e = i * 2;
        indices = indices.concat([s, s + 1, e]);
        indices = indices.concat([e, s + 1, e + 1]);

        if (i == points.length - 1) {
            s = e;
            e = 0;
            indices = indices.concat([s, s + 1, e]);
            indices = indices.concat([e, s + 1, e + 1]);
        }
    }

    var direction = points
        .map(point => [1,-1])
        .reduce((acc, value) => acc.concat(value), []);


    var previous = positions.map((p, i) => {
        if (i < 6) {
            return positions[positions.length - (6 - i)];
        }
        return positions[i - 6];
    });

    var next = positions.map((p, i) => {
        if (i >= positions.length - 6) {
            return positions[i - (positions.length - 6)];
        }
        return positions[i + 6];
    });

    positions = new Float32Array(positions);
    indices = new Uint32Array(indices);
    direction = new Float32Array(direction);
    previous = new Float32Array(previous);
    next = new Float32Array(next);


    var g = new THREE.BufferGeometry();
    g.setIndex(new THREE.BufferAttribute(indices, 1 ));
    g.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.addAttribute('direction', new THREE.BufferAttribute(direction, 1));
    g.addAttribute('previous', new THREE.BufferAttribute(previous, 3));
    g.addAttribute('next', new THREE.BufferAttribute(next, 3));

    // var g = new THREE.PlaneGeometry(1,0);
    var m = new THREE.ShaderMaterial({
        vertexShader: glslify('./shaders/line.vert'),
        fragmentShader: glslify('./shaders/line.frag')
    });
    // m.side = THREE.DoubleSide;
    var mm = new THREE.Mesh(g, m);
    mm.rotateX(Math.PI * -.25);
    parent.add(mm);

};

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
