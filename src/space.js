const random = require('random-seed').create(2);


const Space = function(parent) {

    const group = new THREE.Group();
    parent.add(group);

    const material = new THREE.MeshBasicMaterial({
        color: 0x322f57
    });

    const radius = 15;
    const geometries = this.geometries();
    const distribution = new THREE.DodecahedronGeometry(radius);

    distribution.vertices.forEach(vert => {
        var direction, position, size;

        direction = this.randomPointOnSphere(6, random.random);
        position = vert.clone().add(direction);
        size = random.floatBetween(1, 2);

        const geometry = geometries[i % geometries.length];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.scale.set(size, size, size);
        group.add(mesh);
    });

    this.group = group;
};

Space.prototype.setVisible = function(value) {
    this.group.visible = value;
};

Space.prototype.geometries = function() {
    return [
        new THREE.DodecahedronGeometry(1),
        new THREE.IcosahedronGeometry(1),
        new THREE.OctahedronGeometry(1)
    ];
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
