var THREE = require('three');


const CrystalPlanter = function(parent, app) {
    this.parent = parent;
    app.eventMediator.on('soil.mousedown', this.onMouseDown.bind(this));
};

CrystalPlanter.prototype.onMouseDown = function(intersect) {
    var position = intersect.point.clone();
    this.parent.worldToLocal(position);

    var normal = intersect.face.vertexNormals[0];
    this.parent.worldToLocal(normal);
    normal.multiplyScalar(.5);
    var top = intersect.point.clone().add(normal);
    this.parent.worldToLocal(top);

    var crystal = this.addCrystal(position, top);
};

CrystalPlanter.prototype.addCrystal = function(position, top) {
    var crystal = this.createCrystal();
    crystal.position.copy(position);
    crystal.lookAt(top);
    this.scaleCrystal(crystal, .5, 2);
};

CrystalPlanter.prototype.scaleCrystal = function(crystal, width, height) {
    crystal.scale.set(width, width, height);
};

CrystalPlanter.prototype.createCrystal = function() {
    var size = .1;
    const geometry = new THREE.BoxGeometry(size, size, size * 2);
    geometry.translate(0, 0, size);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.parent.add(mesh);
    return mesh;
};

module.exports = CrystalPlanter;
