const random = require('random-seed').create('escher/fuller/moebius');

const polyhedra = require('./lib/polyhedra');
const InstancedMesh = require('./instanced-mesh');
const crystalGen = require('./crystal-gen');
const geometryTools = require('./geometry-tools');
const materials = require('./materials');


const Space = function(parent, app) {

    const group = new THREE.Group();
    parent.add(group);

    this.group = group;
    this.app = app;

    this.addPlanets();
    this.addStars();

    this.hyperMultiplier = 0;

    const t = {t: 0};
    const axis = new THREE.Vector3(1,1,0).normalize();
    var rotate = new app.TWEEN.Tween(t)
        .to({t: 1}, 1000000)
        .onUpdate(object => {
            group.quaternion.setFromAxisAngle(axis, object.t * Math.PI * 2);
        })
        .repeat(Infinity);

    app.eventMediator.on('start', function() {
        rotate.start();
    });
};

Space.prototype.setVisible = function(value) {
    this.group.visible = value;
};

Space.prototype.addStars = function() {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const vertices = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);

    for (var i = 0; i < count; i++) {
        var vertex = this.randomPointOnSphere(
            random.floatBetween(30, 40),
            random.random
        );
        vertices[i * 3 + 0] = vertex[0];
        vertices[i * 3 + 1] = vertex[1];
        vertices[i * 3 + 2] = vertex[2];
        size[i] = 0.05 + Math.pow(random.random(), 4) * .2;
        seed[i] = random.random();
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geometry.addAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    const material = materials.stars;
    const particles = new THREE.Points(geometry, material);

    particles.renderOrder = -1;

    this.group.add(particles);
};

Space.prototype.addPlanets = function() {

    var arrangements = this.planetArrangements();
    var geometries = this.planetGeometries();


    var largeA = [];
    var largeB = [];

    arrangements[0].forEach((v, i) => {
        if ([0,4,7,10,5,6].indexOf(i) === -1) {
            largeB.push(v);
        } else {
            largeA.push(v);
        }
    });


    var smallA = [];
    var smallB = [];

    arrangements[2].forEach((v, i) => {
        if (i % 2 === 0) {
            smallA.push(v);
        } else {
            smallB.push(v);
        }
    });


    const specs = [
        {
            geometry: geometries.snowflakeSolid.geometry,
            material: materials.planetSolid,
            objects: smallA.map(this.createPlanet.bind(this, {
                object: geometries.snowflakeSolid.object,
                size: [.75, 2],
                dist: [10, 15],
                speed: [5, 2],
                variants: 1
            })),
        },
        {
            geometry: geometries.snowballSolid.geometry,
            material: materials.planetSolid,
            objects: smallB.map(this.createPlanet.bind(this, {
                object: geometries.snowballSolid.object,
                size: [.2, .4],
                dist: [10, 15],
                speed: [10, 5],
                variants: 2
            })).concat(
            arrangements[2].map(this.createPlanet.bind(this, {
                object: geometries.snowballSolid.object,
                size: [.2, .4],
                dist: [20, 30],
                speed: [10, 5],
                variants: 2
            }))),
        },
        {
            geometry: geometries.snowflakeWireframe.geometry,
            material: materials.planetWireframe,
            objects: largeB.map(this.createPlanet.bind(this, {
                object: geometries.snowflakeWireframe.object,
                size: [6, 9],
                dist: [20, 30],
                speed: [1, .5],
                variants: 2
            }))
        },
        {
            geometry: geometries.snowballSolid.geometry,
            material: materials.planetBackground,
            objects: largeA.map(this.createPlanet.bind(this, {
                object: geometries.snowballSolid.object,
                size: [12, 17],
                dist: [50, 60],
                speed: [1, .5],
                variants: 2
            }))
        }
    ];

    specs.forEach(spec => {

        var instanced = new InstancedMesh(spec.geometry, spec.material, spec.objects);
        this.group.add(instanced.mesh);

        if (spec.material.transparent) {
            instanced.mesh.renderOrder = -1;
        }

        var z = new THREE.Vector3(0,0,1);
        var quatA = new THREE.Quaternion();
        var quatB = new THREE.Quaternion();

        instanced.mesh.onBeforeRender = function() {
            var d = this.app.delta * .000025;

            spec.objects.forEach(object => {

                var extra = Math.min(this.hyperMultiplier * 40, 500) * d;

                quatA.setFromAxisAngle(z, extra + object.spec.rotateSpeed * d);
                quatB.setFromAxisAngle(z, extra + object.spec.rotateSpeed * d * 5);

                object.quaternion.multiply(quatA);
                object.updateMatrixWorld(true);

                if (object.children) {
                    object.children.forEach(child => {
                        child.quaternion.multiply(quatB);
                    });
                }
            });

            instanced.update();
        }.bind(this);
    });
};

Space.prototype.planetArrangements = function() {
    const solid = polyhedra.archimedean.Icosidodecahedron;

    const vertices = solid.vertex.map(vertex => {
        return new THREE.Vector3().fromArray(vertex);
    });

    var sets = [];

    var faceTypes = solid.face.reduce((acc, value) => {
        const normals = acc[value.length] = acc[value.length] || [];
        normals.push(this.findFaceNormal(vertices, value));
        return acc;
    }, {});

    Object.keys(faceTypes).forEach(key => {
        sets.push(faceTypes[key]);
    });

    sets.push(vertices.map(vertex => {
        return vertex.normalize();
    }));

    sets.sort((a, b) => a.length - b.length);

    return sets;
};

Space.prototype.findFaceNormal = function(vertices, face) {
    return face.reduce((acc, value) => {
        return acc.add(vertices[value]);
    }, new THREE.Vector3()).normalize();
};

Space.prototype.planetGeometries = function() {

    var geometries = {};

    var solid = polyhedra.platonic.Dodecahedron;

    var g = new THREE.Geometry();
    g.vertices = solid.vertex.map(vertex => {
        return new THREE.Vector3().fromArray(vertex);
    });
    solid.face.forEach(face => {
        var d = g.vertices.length;
        var normal = this.findFaceNormal(g.vertices, face).multiplyScalar(1.9);
        g.vertices.push(normal);
        for (var i = 0; i < face.length; i++) {
            g.faces.push(new THREE.Face3(
                face[i], 
                face[(i + 1) % face.length], 
                d
            ));
        }
    });
    var snowballGeometry = g;
    snowballGeometry.computeFlatVertexNormals();
    
    var snowballBufferGeometry = new THREE.BufferGeometry().fromGeometry(snowballGeometry);

    geometries.snowballSolid = {
        geometry: snowballBufferGeometry,
        object: new THREE.Object3D()
    };


    var snowflakeObject = new THREE.Object3D();
    var icoDistribution = new THREE.IcosahedronGeometry(1);
    icoDistribution.vertices.forEach(vertex => {
        var object = new THREE.Object3D();
        object.lookAt(vertex);
        object.position.copy(vertex).multiplyScalar(.75);
        snowflakeObject.add(object);
    });

    var snowflakeBufferGeometry = new THREE.OctahedronBufferGeometry();
    snowflakeBufferGeometry.scale(.2,.2,.5);

    geometries.snowflakeSolid = {
        geometry: snowflakeBufferGeometry,
        object: snowflakeObject
    };


    var snowflakeWireframeGeometry = new THREE.OctahedronGeometry();
    snowflakeWireframeGeometry.scale(.2,.2,.5);
    snowflakeWireframeGeometry = geometryTools.wireframeMesh(snowflakeWireframeGeometry, .002);
    var snowflakeWireframeBufferGeometry = new THREE.BufferGeometry().fromGeometry(snowflakeWireframeGeometry);
    
    geometries.snowflakeWireframe = {
        geometry: snowflakeWireframeBufferGeometry,
        object: snowflakeObject
    };

    return geometries;
};

Space.prototype.createPlanet = function(spec, normal, i) {

    if (i % 2 === 0) {
        factor = random.floatBetween(0, .5);    
    } else {
        factor = random.floatBetween(.5, 1);
    }
    
    var factor = Math.pow(factor, 2);

    var size = THREE.Math.lerp(spec.size[0], spec.size[1], factor);
    var rotateSpeed = THREE.Math.lerp(spec.speed[0], spec.speed[1], factor);

    var dist = random.floatBetween(spec.dist[0], spec.dist[1]);
    var position = normal.clone().multiplyScalar(dist);

    var direction = new THREE.Vector3().fromArray(this.randomPointOnSphere(1, random.random));
    direction.cross(normal).normalize();
    direction.multiplyScalar(spec.dist[0] * 0.3);
    position.add(direction);

    var rotation = new THREE.Euler(
        random.random() * Math.PI * 2,
        random.random() * Math.PI,
        0
    );

    var object = spec.object.clone();

    object.position.copy(position);
    object.quaternion.setFromEuler(rotation);
    object.scale.set(size, size, size);

    object.spec = {
        rotateSpeed: rotateSpeed,
        variant: random.intBetween(0, spec.variants - 1)
    };

    return object;
};

Space.prototype.randomPointOnSphere = function(radius, rand) {
    var u = rand();
    var v = rand();
    var phi = 2 * Math.PI * u;
    var theta = Math.acos(2 * v - 1);
    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);
    return [x, y, z];
};


module.exports = Space;
