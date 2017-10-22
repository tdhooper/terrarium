const THREE = require('three');

const SoilCursor = function(parent, app) {

    const geometry = new THREE.RingGeometry(.4, .5, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    material.depthTest = false;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 1;
    mesh.visible = false;

    parent.add(mesh);

    this.parent = parent;
    this.mesh = mesh;
    this.material = material;

    app.eventMediator.on('soil-area.mouseover', this.show.bind(this));
    app.eventMediator.on('soil-area.touchstart', this.show.bind(this));

    app.eventMediator.on('soil-normals.mousemove', this.position.bind(this));
    app.eventMediator.on('soil-normals.touchstart', this.position.bind(this));

    app.eventMediator.on('soil-area.mouseout', this.hide.bind(this));
    app.eventMediator.on('soil-area.touchend', this.hide.bind(this));
    app.eventMediator.on('soil-area.touchmove', this.hide.bind(this));

    app.eventMediator.on('soil-area.mousedown', this.highlightOn.bind(this));
    app.eventMediator.on('soil-area.touchholddown', this.highlightOn.bind(this));

    app.eventMediator.on('soil-area.mouseup', this.highlightOff.bind(this));
    app.eventMediator.on('soil-area.touchend', this.highlightOff.bind(this));
};


SoilCursor.prototype.show = function() {
    this.mesh.visible = true;
};

SoilCursor.prototype.position = function(intersect) {
    var position = intersect.point.clone();
    this.parent.worldToLocal(position);

    var normal = intersect.face.normal;
    var top = position.clone().add(normal);

    this.mesh.position.copy(position);
    this.mesh.lookAt(top);
};

SoilCursor.prototype.hide = function() {
    this.mesh.visible = false;
};

SoilCursor.prototype.highlightOn = function() {
    this.material.color.setHex(0x00ff00);
};

SoilCursor.prototype.highlightOff = function() {
    this.material.color.setHex(0xff0000);
};

module.exports = SoilCursor;
