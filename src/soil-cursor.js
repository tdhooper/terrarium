const THREE = require('three');

const InlineLog = require('./inline-log');


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
    this.scale = 1;

    app.eventMediator.on('soil-area.mouseover', this.show.bind(this));
    app.eventMediator.on('soil-area.touchstart', this.show.bind(this));

    app.eventMediator.on('soil-normals.mousemove', this.position.bind(this));
    app.eventMediator.on('soil-normals.touchstart', this.position.bind(this)); // TODO make touch/mouse over/move behave the same

    app.eventMediator.on('soil-area.touchholdstart', this.startCountdown.bind(this));
    app.eventMediator.on('soil-area.touchholdend', this.resetCountdown.bind(this));

    app.eventMediator.on('soil-area.mouseout', this.hide.bind(this));
    app.eventMediator.on('soil-area.touchend', this.hide.bind(this));

    app.eventMediator.on('soil-area.mousedown', this.highlightOn.bind(this));
    app.eventMediator.on('soil-area.touchholddown', this.highlightOn.bind(this));

    app.eventMediator.on('soil-area.mouseup', this.highlightOff.bind(this));
    app.eventMediator.on('soil-area.touchend', this.highlightOff.bind(this));

    this.countdownTween = new app.TWEEN.Tween(this.mesh.scale)
        .to(
            {x: 1, y: 1, z: 0},
            app.interactionPublisher.TOUCH_HOLD_DELAY
        );

    // this.log = new InlineLog();
};

SoilCursor.prototype.startCountdown = function() {
    if (this.isHeld) {
        return;
    }

    // this.log.log(this.scale);
    this.mesh.scale.set(this.scale, this.scale, this.scale);
    this.countdownTween.start();
};

SoilCursor.prototype.resetCountdown = function() {
     // this.log.log('reset');
    this.countdownTween && this.countdownTween.stop();
};

SoilCursor.prototype.show = function() {
    this.isOver = true;
    this.mesh.visible = true;
};

SoilCursor.prototype.position = function(intersect) {
    this.intersect = intersect;
    this.setPosition();
};

SoilCursor.prototype.setPosition = function() {
    if (this.isHeld) {
        return;
    }

    this.positionIntersect = this.intersect;

    var position = this.intersect.point.clone();

    var normal = this.intersect.face.normal.clone();
    this.intersect.object.localToWorld(normal);

    var top = position.clone().add(normal);

    this.mesh.position.copy(position);
    this.mesh.lookAt(top);

    const dist = this.app.camera.position.distanceTo(position);
    this.scale = dist * .5;
    // this.mesh.scale.set(this.scale, this.scale, this.scale);
};

SoilCursor.prototype.hide = function() {
    this.isOver = false;
    if (this.isHeld) {
        return;
    }
    this.mesh.visible = false;
};

SoilCursor.prototype.highlightOn = function() {
    // this.log.log('Done');
    this.isHeld = true;
    this.material.color.setHex(0x00ff00);
    this.app.eventMediator.emit('soil-cursor.down', this.positionIntersect);
};

SoilCursor.prototype.highlightOff = function() {
    this.isHeld = false;
    this.setPosition();
    if ( ! this.isOver) {
        this.hide();
    }
    this.material.color.setHex(0xff0000);
    this.app.eventMediator.emit('soil-cursor.up');
};

module.exports = SoilCursor;
