/*
// instancedSpec(matrix)
        setRotation() // marks needs update

// instancedSpecs([])
        setRotation()

    inner = [instancedSpec, instancedSpec, ...]
    outer = instancedSpecs(inner)
    all = 

// instancedMesh(geometry, material, matricies)

// instancedMesh(geometry, material, objects)

    init()
        inner = [object3d(), object3d(), ...]
        outer = object3d().add(inner)

        instancePositions = [];
        instanceQuaternions = [];
        instanceScales = [];

        addObject()
            if children
                for child in children
                    addObject(child)
            else
                // updateMatrixWorld(true)
                matrixWorld.decompose( position, quaternion, result );
                i = add to positions, quats, scales
                this.objectMap[i] = object

        for object in objects:
            addObject(object)

        create instancedgeom
        create attributes

        return

    update()
        for i, object in this objectMap:
            object.matrixWorld.decompose( position, quaternion, result );
            positionAttr.setXYZ(i, position.x, position.y, position.z);
            quaternionAttr.setXYZW(i, quaternion.x, quaternion.y, quaternion.z, quaternion.w);

*/


var InstancedMesh = function(bufferGeometry, material, objects) {

    var instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.attributes.position = bufferGeometry.attributes.position;
    instancedGeometry.attributes.normal = bufferGeometry.attributes.normal;

    this.objectMap = [];

    var instancePositions = [];
    var instanceQuaternions = [];
    var instanceScales = [];

    var matrix = new THREE.Matrix4();
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    var addObject = function(object) {
        object.updateMatrixWorld();
        if (object.children.length) {
            object.children.forEach(addObject.bind(this));
            return;
        }
        object.matrixWorld.decompose(position, quaternion, scale);
        instancePositions.push(position.x, position.y, position.z);
        instanceQuaternions.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        instanceScales.push(scale.x, scale.y, scale.z);
        var i = this.objectMap.length;
        this.objectMap.push(object);
    };

    objects.forEach(addObject.bind(this));

    this.positionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3).setDynamic(true);
    this.quaternionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceQuaternions), 4).setDynamic(true);
    this.scaleAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 3).setDynamic(true);

    instancedGeometry.addAttribute('instancePosition', this.positionAttr);
    instancedGeometry.addAttribute('instanceQuaternion', this.quaternionAttr);
    instancedGeometry.addAttribute('instanceScale', this.scaleAttr);

    this.mesh = new THREE.Mesh(instancedGeometry, material);
};

InstancedMesh.prototype.update = function() {
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();
    var object;
    for (var i = 0; i < this.objectMap.length; i++) {
        object = this.objectMap[i];
        object.matrixWorld.decompose(position, quaternion, scale);
        this.positionAttr.setXYZ(i, position.x, position.y, position.z);
        this.quaternionAttr.setXYZW(i, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        this.scaleAttr.setXYZ(i, scale.x, scale.y, scale.z);
    }
    this.positionAttr.needsUpdate = true;
    this.quaternionAttr.needsUpdate = true;
    this.scaleAttr.needsUpdate = true;
};

module.exports = InstancedMesh;


// Space.prototype.createInstancedGeometry = function(bufferGeometry, parentSpecs, childMatricies) {
//     var instancedGeometry = new THREE.InstancedBufferGeometry();
//     instancedGeometry.attributes.position = bufferGeometry.attributes.position;
//     instancedGeometry.attributes.normal = bufferGeometry.attributes.normal;

//     var children = childMatricies.length;

//     var instancePositions = [];
//     var instanceQuaternions = [];
//     var instanceScales = [];

//     var matrix = new THREE.Matrix4();
//     var position = new THREE.Vector3();
//     var quaternion = new THREE.Quaternion();
//     var scale = new THREE.Vector3();

//     parentSpecs.forEach(spec => {
//         childMatricies.forEach(child => {
//             matrix.multiplyMatrices(spec.matrix, child);
//             matrix.decompose(position, quaternion, scale);
//             instancePositions.push(position.x, position.y, position.z);
//             instanceQuaternions.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
//             instanceScales.push(scale.x, scale.y, scale.z);
//         });
//     });

//     var positionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3).setDynamic(true);
//     var quaternionAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceQuaternions), 4).setDynamic(true);
//     var scaleAttr = new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 3);

//     instancedGeometry.addAttribute('instancePosition', positionAttr);
//     instancedGeometry.addAttribute('instanceQuaternion', quaternionAttr);
//     instancedGeometry.addAttribute('instanceScale', scaleAttr);

//     var rotationA = new THREE.Matrix4();
//     var rotationB = new THREE.Matrix4();

//     return {
//         geometry: instancedGeometry,
//         animate: function(d) {
//             d *= .00005;
//             parentSpecs.forEach((spec, p) => {
//                 rotationA.makeRotationZ(d * spec.rotateSpeed);
//                 rotationB.makeRotationZ(d * spec.rotateSpeed * 3);
//                 childMatricies.forEach((child, c) => {
//                     var i = p * children + c;
//                     matrix.copy(spec.matrix);
//                     matrix.multiply(rotationA);
//                     matrix.multiply(child);
//                     matrix.multiply(rotationB);
//                     matrix.decompose(position, quaternion, scale);
//                     positionAttr.setXYZ(i, position.x, position.y, position.z);
//                     quaternionAttr.setXYZW(i, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
//                 });
//             });
//             positionAttr.needsUpdate = true;
//             quaternionAttr.needsUpdate = true;
//         }
//     };
// };