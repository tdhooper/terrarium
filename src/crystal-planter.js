var THREE = require('three');


const CrystalPlanter = function(parent, app) {
    this.parent = parent;
    this.app = app;
    app.eventMediator.on('soil.mousedown', this.onMouseDown.bind(this));
    app.eventMediator.on('soil.mouseup', this.onMouseUp.bind(this));
};

CrystalPlanter.prototype.onMouseDown = function(intersect) {
    var position = intersect.point.clone();
    this.parent.worldToLocal(position);

    var normal = intersect.face.vertexNormals[0];
    this.parent.worldToLocal(normal);
    normal.multiplyScalar(.5);
    var top = intersect.point.clone().add(normal);
    this.parent.worldToLocal(top);

    this.activeCrystal = new Crystal(this.parent, this.app, position, top);
};

CrystalPlanter.prototype.onMouseUp = function() {
    if (this.activeCrystal) {
        this.activeCrystal.stopGrowth();
    }
};


const Crystal = function(parent, app, position, top) {
    var width = .2;
    var height = 1;

    const geometry = new THREE.BoxGeometry(width, width, height);
    geometry.translate(0, 0, height / 2);

    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    parent.add(mesh);

    mesh.position.copy(position);
    mesh.lookAt(top);

    this.mesh = mesh;

    var TWEEN = app.TWEEN;
    this.mesh.scale.set(.25, .25, 0);
    this.growTween = new TWEEN.Tween(this.mesh.scale)
        .to({x: 1, y: 1, z: 1}, 1500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
};

Crystal.prototype.stopGrowth = function() {
    this.growTween.stop();
};


module.exports = CrystalPlanter;
