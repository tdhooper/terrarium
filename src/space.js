const random = require('random-seed').create('escher/fuller/moebius');

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
    new app.TWEEN.Tween(t)
        .to({t: 1}, 1000000)
        .onUpdate(object => {
            group.quaternion.setFromAxisAngle(axis, object.t * Math.PI * 2);
        })
        .repeat(Infinity)
        .start();
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

    var instancedGeometryA = this.createInstancedGeometry(
        wireframeBufferGeometry,
        specs.wireframe,
        snowflakeMatricies
    );
    var instancedMeshA = new THREE.Mesh(instancedGeometryA.geometry, materials.planetWireframe);
    instancedMeshA.onBeforeRender = function() {
        instancedGeometryA.updateRotation(this.app.elapsed * .00005);
    }.bind(this);
    this.group.add(instancedMeshA);

    var instancedGeometryB = this.createInstancedGeometry(
        bufferGeometry,
        specs.solid,
        snowflakeMatricies
    );
    var instancedMeshB = new THREE.Mesh(instancedGeometryB.geometry, materials.planetSolid);
    instancedMeshB.onBeforeRender = function() {
        instancedGeometryB.updateRotation(this.app.elapsed * .0001);
    }.bind(this);
    this.group.add(instancedMeshB);
};

Space.prototype.planetsSpec = function() {

    var specs = {
        solid: [],
        wireframe: []
    };

    const radius = 20;

    const distributionA = new THREE.IcosahedronGeometry(radius);
    const distributionB = new THREE.DodecahedronGeometry(radius);

    distributionB.rotateX(Math.PI * .5);

    distributionA.rotateX(1.1);
    distributionB.rotateX(1.1);

    var verts = distributionA.vertices.concat(distributionB.vertices);

    var spec, direction, position, size, dist, isSolid, rotateSpeed, rotation;

    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    verts.forEach((vert, i) => {

        if (i < distributionA.vertices.length) {
            isSolid = true;
            size = random.floatBetween(0, 1/3);
        } else if (i % 2 === 0){
            size = random.floatBetween(1/3, 2/3);
            isSolid = false;
        } else {
            size = random.floatBetween(2/3, 1);
            isSolid = false;
        }

        dist = random.floatBetween(1, 1.3);
        direction = new THREE.Vector3().fromArray(this.randomPointOnSphere(3, random.random));
        position = vert.clone().multiplyScalar(dist).add(direction);
        
        rotateSpeed = THREE.Math.lerp(1, .1, size);

        size = size * 6 + 1;

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

        if (isSolid) {
            specs.solid.push({
                matrix: matrix,
                rotateSpeed: rotateSpeed
            });
        } else {
            specs.wireframe.push({
                matrix: matrix,
                rotateSpeed: rotateSpeed
            });
        }
    });

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
        updateRotation: function(d) {
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
