const random = require('random-seed').create('daadrD22sadassk');

var materials = require('./materials');


const Space = function(parent, app) {

    const group = new THREE.Group();
    parent.add(group);

    this.group = group;
    this.app = app;

    this.addPlanets();
};

Space.prototype.setVisible = function(value) {
    this.group.visible = value;
};

Space.prototype.addPlanets = function() {
    const solidMaterial = materials.crystal.clone();
    solidMaterial.uniforms.seed.value = 3;
    solidMaterial.uniforms.scale.value = .2;
    solidMaterial.uniforms.height.value = 1;
    solidMaterial.uniforms.flash.value = 3;

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

    const TWEEN = this.app.TWEEN;

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
        const rotate = THREE.Math.lerp(15000, 300000, size);

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
        this.group.add(mesh);

        mesh.rotation.z = 0;
        new TWEEN.Tween(mesh.rotation)
            .to({z: Math.PI * 2}, rotate)
            .repeat(Infinity)
            .start();
    });
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
