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

    var bufferGeometry = new THREE.OctahedronBufferGeometry();
    bufferGeometry.scale(.2,.2,.5);

    var wireframeGeometry = new THREE.OctahedronGeometry();
    wireframeGeometry.scale(.2,.2,.5);
    wireframeGeometry = geometryTools.wireframeMesh(wireframeGeometry, .002);
    var wireframeBufferGeometry = new THREE.BufferGeometry().fromGeometry(wireframeGeometry);

    var origin = new THREE.Vector3();
    var up = new THREE.Vector3(0,1,0);

    var icoDistribution = new THREE.IcosahedronGeometry(1);

    var snowflakeMatricies = icoDistribution.vertices.map(vertex => {
        var matrix = new THREE.Matrix4();
        matrix.lookAt(vertex, origin, up);
        matrix.setPosition(vertex.clone().multiplyScalar(.75));
        return matrix;
    });

    var specs = this.planetsSpec();

    var snowflakeObject = new THREE.Object3D();
    snowflakeMatricies.forEach(matrix => {
        var object = new THREE.Object3D();
        object.applyMatrix(matrix);
        snowflakeObject.add(object);
    });

    var objects = [];

    specs.solid.forEach(spec => {
        var object = snowflakeObject.clone();
        object.applyMatrix(spec.matrix);
        object.spec = spec;
        objects.push(object);
    });

    var instanced = new InstancedMesh(bufferGeometry, materials.planetSolid, objects);
    this.group.add(instanced.mesh);

    var z = new THREE.Vector3(0,0,1);
    var quatA = new THREE.Quaternion();
    var quatB = new THREE.Quaternion();

    var elapsed = 0;

    instanced.mesh.onBeforeRender = function() {
        var d = (this.app.elapsed - elapsed) * .00005;
        elapsed = this.app.elapsed;

        objects.forEach(object => {

            quatA.setFromAxisAngle(z, object.spec.rotateSpeed * d);
            quatB.setFromAxisAngle(z, object.spec.rotateSpeed * d * 3);

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

    // var instancedGeometryA = this.createInstancedGeometry(
    //     wireframeBufferGeometry,
    //     specs.wireframe,
    //     snowflakeMatricies
    // );
    // var instancedMeshA = new THREE.Mesh(instancedGeometryA.geometry, materials.planetWireframe);
    // instancedMeshA.onBeforeRender = function() {
    //     instancedGeometryA.animate(this.app.elapsed);
    // }.bind(this);
    // this.group.add(instancedMeshA);
    // instancedMeshA.renderOrder = -1;

    // var instancedGeometryB = this.createInstancedGeometry(
    //     bufferGeometry,
    //     specs.solid,
    //     snowflakeMatricies
    // );
    // var instancedMeshB = new THREE.Mesh(instancedGeometryB.geometry, materials.planetSolid);
    // instancedMeshB.onBeforeRender = function() {
    //     instancedGeometryB.animate(this.app.elapsed);
    // }.bind(this);
    // this.group.add(instancedMeshB);
};

Space.prototype.planetsSpec = function() {

    var spec, direction, position, size, dist, isSolid, rotateSpeed, rotation, factor, factor2, point;
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    var createSpec = function(spec, normal, i) {

        if (i % 2 === 0) {
            factor = random.floatBetween(0, .5);    
        } else {
            factor = random.floatBetween(.5, 1);
        }
        
        factor = Math.pow(factor, 2);

        size = THREE.Math.lerp(spec.size[0], spec.size[1], factor);
        rotateSpeed = THREE.Math.lerp(spec.speed[0], spec.speed[1], factor);

        dist = random.floatBetween(spec.dist[0], spec.dist[1]);
        position = normal.clone().multiplyScalar(dist);

        direction = new THREE.Vector3().fromArray(this.randomPointOnSphere(1, random.random));
        direction.cross(normal).normalize();
        direction.multiplyScalar(spec.dist[0] * 0.1);
        position.add(direction);

        rotation = new THREE.Euler(
            random.random() * Math.PI * 2,
            random.random() * Math.PI,
            0
        );

        var matrix = new THREE.Matrix4().compose(
            position,
            quaternion.setFromEuler(rotation),
            scale.set(size, size, size)
        );

        return {
            matrix: matrix,
            rotateSpeed: rotateSpeed
        };
    };

    const solid = polyhedra.archimedean.Icosidodecahedron;

    const vertices = solid.vertex.map(vertex => {
        return new THREE.Vector3().fromArray(vertex);
    });

    var findFaceNormal = function(face) {
        return face.reduce((acc, value) => {
            return acc.add(vertices[value]);
        }, new THREE.Vector3()).normalize();
    };

    var faceTypes = solid.face.reduce((acc, value) => {
        const normals = acc[value.length] = acc[value.length] || [];
        normals.push(findFaceNormal(value));
        return acc;
    }, {});

    const keys = Object.keys(faceTypes).sort((a, b) => {
        return parseInt(a) - parseInt(b);
    });
    console.log(keys);
    faceTypes = keys.map(key => {
        return faceTypes[key];
    });

    const vertNormals = vertices.map(vertex => {
        return vertex.normalize();
    });

    const specs = {
        solid: vertNormals.map(createSpec.bind(this, {
            size: [1.5, 3],
            dist: [20, 30],
            speed: [5, 2]
        })),
        wireframe: faceTypes[1].map(createSpec.bind(this, {
            size: [10, 15],
            dist: [40, 50],
            speed: [1, .5]
        })).concat(
        faceTypes[0].map(createSpec.bind(this, {
            size: [3, 5],
            dist: [20, 30],
            speed: [1, .5]
        }))
        ),
    };

    return specs;
};

Space.prototype.createInstancedGeometry = function(bufferGeometry, parentSpecs, childMatricies) {
    var instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.attributes.position = bufferGeometry.attributes.position;
    instancedGeometry.attributes.normal = bufferGeometry.attributes.normal;

    var children = childMatricies.length;

    var instancePositions = [];
    var instanceQuaternions = [];
    var instanceScales = [];

    var matrix = new THREE.Matrix4();
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    parentSpecs.forEach(spec => {
        childMatricies.forEach(child => {
            matrix.multiplyMatrices(spec.matrix, child);
            matrix.decompose(position, quaternion, scale);
            instancePositions.push(position.x, position.y, position.z);
            instanceQuaternions.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            instanceScales.push(scale.x, scale.y, scale.z);
        });
    });

    var positionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3).setDynamic(true);
    var quaternionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceQuaternions), 4).setDynamic(true);
    var scaleAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 3);

    instancedGeometry.addAttribute('instancePosition', positionAttr);
    instancedGeometry.addAttribute('instanceQuaternion', quaternionAttr);
    instancedGeometry.addAttribute('instanceScale', scaleAttr);

    var rotationA = new THREE.Matrix4();
    var rotationB = new THREE.Matrix4();

    return {
        geometry: instancedGeometry,
        animate: function(d) {
            d *= .00005;
            parentSpecs.forEach((spec, p) => {
                rotationA.makeRotationZ(d * spec.rotateSpeed);
                rotationB.makeRotationZ(d * spec.rotateSpeed * 3);
                childMatricies.forEach((child, c) => {
                    var i = p * children + c;
                    matrix.copy(spec.matrix);
                    matrix.multiply(rotationA);
                    matrix.multiply(child);
                    matrix.multiply(rotationB);
                    matrix.decompose(position, quaternion, scale);
                    positionAttr.setXYZ(i, position.x, position.y, position.z);
                    quaternionAttr.setXYZW(i, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                });
            });
            positionAttr.needsUpdate = true;
            quaternionAttr.needsUpdate = true;
        }
    };
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
