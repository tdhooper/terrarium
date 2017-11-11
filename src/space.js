const random = require('random-seed').create('darD22saASdak');

var materials = require('./materials');


const Space = function(parent) {

    const group = new THREE.Group();
    parent.add(group);

    const color = new THREE.Color(0x423a6f);
    const front = new THREE.Color(0x5cbcff);
    const back = new THREE.Color(0x322f57);
    back.lerp(front, .25);

    const solidMaterial = materials.planetSolid;

    const lineMaterial = materials.planetWireframe;

    const radius = 20;
    const geometries = this.geometries();
    const distributionA = new THREE.IcosahedronGeometry(radius);
    const distributionB = new THREE.DodecahedronGeometry(radius);

    distributionB.rotateX(Math.PI * .5);

    distributionA.rotateX(1.1);
    distributionB.rotateX(1.1);
    distributionA.rotateY(4.8);
    distributionB.rotateY(4.8);

    var verts = distributionA.vertices.concat(distributionB.vertices);
    // var verts = distributionB.vertices;

    verts.forEach((vert, i) => {
        var direction, position, size;

        var dist = random.floatBetween(.8, 1.3);
        direction = this.randomPointOnSphere(3, random.random);
        position = vert.clone().multiplyScalar(dist).add(direction);
        size = random.random();

        if (i < distributionA.vertices.length) {
            size = Math.pow(size, 6);
        }

        const geom = Math.round(size * 2);
        const geometry = geometries[geom];

        var mesh;

        if (geom === 0) {
            mesh = new THREE.Mesh(geometry.solid, solidMaterial);
        } else {
            mesh = new THREE.LineSegments(geometry.wireframe, lineMaterial);
        }

        size = size * 5 + 1;
        
        mesh.position.copy(position);
        mesh.scale.set(size, size, size);
        mesh.rotateX(random.random() * Math.PI);
        mesh.rotateY(random.random() * Math.PI);
        group.add(mesh);
    });

    this.group = group;
};

Space.prototype.setVisible = function(value) {
    this.group.visible = value;
};

Space.prototype.geometries = function() {
    return [
        new THREE.OctahedronBufferGeometry(1),
        new THREE.DodecahedronBufferGeometry(1),
        new THREE.IcosahedronBufferGeometry(1)
    ].map(geometry => {
        return {
            solid: geometry,
            wireframe: new THREE.EdgesGeometry(geometry)
        };
    });
};

Space.prototype.randomPointOnSphere = function(radius, rand) {
    var u = rand();
    var v = rand();
    var phi = 2 * Math.PI * u;
    var theta = Math.acos(2 * v - 1);
    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);
    return new THREE.Vector3(x, y, z);
};

module.exports = Space;
