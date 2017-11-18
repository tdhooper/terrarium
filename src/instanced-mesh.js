
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
