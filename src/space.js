const random = require('random-seed').create('escher/fuller/moebius');
const polyhedra = require('polyhedra');

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

    new this.app.TWEEN.Tween(material.uniforms.time)
        .to({value: 1}, 6000)
        .repeat(Infinity)
        .start();
    
    const particles = new THREE.Points(geometry, material);

    particles.renderOrder = -1;

    this.group.add(particles);
};

Space.prototype.addPlanets = function() {

    var arrangements = this.planetArrangements();
    var geometries = this.planetGeometries();

    const specs = [
        {
            geometry: geometries.snowflakeSolid.geometry,
            material: materials.planetSolid,
            objects: arrangements[2].map(this.createPlanet.bind(this, {
                object: geometries.snowflakeSolid.object,
                size: [1.5, 3],
                dist: [20, 30],
                speed: [5, 2]
            })),
        },
        {
            geometry: geometries.snowflakeWireframe.geometry,
            material: materials.planetWireframe,
            objects: arrangements[0].map(this.createPlanet.bind(this, {
                object: geometries.snowflakeWireframe.object,
                size: [10, 15],
                dist: [40, 50],
                speed: [1, .5]
            })).concat(arrangements[1].map(this.createPlanet.bind(this, {
                object: geometries.snowflakeWireframe.object,
                size: [3, 5],
                dist: [20, 30],
                speed: [1, .5]
            })))
        }
    ];

    specs.forEach(spec => {

        var instanced = new InstancedMesh(spec.geometry, spec.material, spec.objects);
        this.group.add(instanced.mesh);

        var z = new THREE.Vector3(0,0,1);
        var quatA = new THREE.Quaternion();
        var quatB = new THREE.Quaternion();

        var elapsed = 0;

        instanced.mesh.onBeforeRender = function() {
            var d = (this.app.elapsed - elapsed) * .000025;
            elapsed = this.app.elapsed;

            spec.objects.forEach(object => {

                quatA.setFromAxisAngle(z, object.spec.rotateSpeed * d);
                quatB.setFromAxisAngle(z, object.spec.rotateSpeed * d * 5);

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

    var findFaceNormal = function(face) {
        return face.reduce((acc, value) => {
            return acc.add(vertices[value]);
        }, new THREE.Vector3()).normalize();
    };

    var sets = [];

    var faceTypes = solid.face.reduce((acc, value) => {
        const normals = acc[value.length] = acc[value.length] || [];
        normals.push(findFaceNormal(value));
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

Space.prototype.planetGeometries = function() {
    var bufferGeometry = new THREE.OctahedronBufferGeometry();
    bufferGeometry.scale(.2,.2,.5);

    var wireframeGeometry = new THREE.OctahedronGeometry();
    wireframeGeometry.scale(.2,.2,.5);
    wireframeGeometry = geometryTools.wireframeMesh(wireframeGeometry, .002);
    var wireframeBufferGeometry = new THREE.BufferGeometry().fromGeometry(wireframeGeometry);

    var snowflakeObject = new THREE.Object3D();
    var icoDistribution = new THREE.IcosahedronGeometry(1);
    icoDistribution.vertices.forEach(vertex => {
        var object = new THREE.Object3D();
        object.lookAt(vertex);
        object.position.copy(vertex).multiplyScalar(.75);
        snowflakeObject.add(object);
    });

    return {
        snowflakeSolid: {
            geometry: bufferGeometry,
            object: snowflakeObject
        },
        snowflakeWireframe: {
            geometry: wireframeBufferGeometry,
            object: snowflakeObject
        }
    };
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
    direction.multiplyScalar(spec.dist[0] * 0.1);
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
        rotateSpeed: rotateSpeed
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
