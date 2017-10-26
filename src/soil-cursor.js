const THREE = require('three');
var glslify = require('glslify')

const SoilCursor = function(parent, app) {

    const height = 1.;
    const ringInner = .4;
    const ringOuter = .5;

    const ring = new THREE.RingGeometry(ringInner, ringOuter, 32);
    const spike = new THREE.CylinderGeometry(.05, .0, height);

    this.iterateFaceVertexUvs(ring, function(face, vertex, uv) {
        var vertex2d = new THREE.Vector2(vertex.x, vertex.y);
        var angle = vertex2d.angle() / (Math.PI * 2);
        var length = vertex2d.length();
        length = (length - ringInner) / (ringOuter - ringInner);
        uv.set(angle, length);
    });

    this.iterateFaceVertexUvs(spike, function(face, vertex, uv) {
        if (face.normal.y > .9) {
            uv.set(.999, .999);
        }
    });

    spike.rotateX(Math.PI * .5);
    spike.translate(0, 0, height / 2);
    ring.merge(spike);
    const geometry = ring;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            t1: {value: 0},
            t2: {value: 0}
        },
        vertexShader: glslify('./shaders/cursor.vert'),
        fragmentShader: glslify('./shaders/cursor.frag')
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

    app.eventMediator.on('crystal.growth', this.showProgress.bind(this));

    this.countdownTween = new app.TWEEN.Tween(material.uniforms.t1)
        .to(
            {value: 1},
            app.interactionPublisher.TOUCH_HOLD_DELAY
        )
        .easing(app.TWEEN.Easing.Quadratic.In);
};

SoilCursor.prototype.startCountdown = function() {
    if (this.isHeld) {
        return;
    }

    this.countdownTween.start();
};

SoilCursor.prototype.resetCountdown = function() {
    if (this.isHeld) {
        return;
    }
    this.countdownTween && this.countdownTween.stop();
    this.material.uniforms.t1.value = 0;
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
    this.mesh.scale.set(this.scale, this.scale, this.scale);
};

SoilCursor.prototype.hide = function() {
    this.isOver = false;
    if (this.isHeld) {
        return;
    }
    this.mesh.visible = false;
};

SoilCursor.prototype.highlightOn = function() {
    this.isHeld = true;
    this.material.uniforms.t1.value = 1;
    this.app.eventMediator.emit('soil-cursor.down', this.positionIntersect);
};

SoilCursor.prototype.highlightOff = function() {
    this.isHeld = false;
    this.setPosition();
    if ( ! this.isOver) {
        this.hide();
    }
    this.material.uniforms.t1.value = 0;
    this.resetProgress();
    this.app.eventMediator.emit('soil-cursor.up');
};

SoilCursor.prototype.showProgress = function(progress) {
    this.material.uniforms.t2.value = progress;
};

SoilCursor.prototype.resetProgress = function() {
    this.material.uniforms.t2.value = 0;
};

SoilCursor.prototype.iterateFaceVertexUvs = function(geometry, callback) {
    geometry.faces.forEach(function(face, faceIndex) {
        [face.a, face.b, face.c].forEach(function(vertexIndex, faceVertexIndex) {
            var vertex = geometry.vertices[vertexIndex];
            var uv = geometry.faceVertexUvs[0][faceIndex][faceVertexIndex];
            callback(face, vertex, uv);
        })
    });
};

module.exports = SoilCursor;
