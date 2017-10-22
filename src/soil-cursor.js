const THREE = require('three');

const SoilCursor = function(parent, app) {

    const height = 1.;

    const ring = new THREE.RingGeometry(.4, .5, 32);
    const spike = new THREE.CylinderGeometry(.05, .0, height);
    spike.rotateX(Math.PI * .5);
    spike.translate(0, 0, height / 2);
    ring.merge(spike);
    const geometry = ring;

    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    // material.depthTest = false;
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.renderOrder = 1;
    mesh.visible = false;

    parent.add(mesh);

    this.parent = parent;
    this.app = app;
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

SoilCursor.prototype.scaleToZoom = function() {
    const position = this.mesh.position.clone();
    const dist = this.app.camera.position.distanceTo(position);
    const scale = dist * .5;
    this.mesh.scale.set(scale, scale, scale);
};

SoilCursor.prototype.show = function() {
    this.mesh.visible = true;
};

SoilCursor.prototype.position = function(intersect) {
    var position = intersect.point.clone();

    var normal = intersect.face.normal.clone();
    intersect.object.localToWorld(normal);

    var top = position.clone().add(normal);

    this.mesh.position.copy(position);
    this.mesh.lookAt(top);

    this.scaleToZoom();
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
