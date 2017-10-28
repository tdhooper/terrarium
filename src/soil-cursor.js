const THREE = require('three');
var glslify = require('glslify');

const SoilCursor = function(parent, app) {

    const height = 1;
    const ringInner = .35;
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
        fragmentShader: glslify('./shaders/cursor.frag'),
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
    this.visible = true;
    this.mesh.visible = true;
};

SoilCursor.prototype.hide = function() {
    this.isOver = false;
    if (this.isHeld) {
        return;
    }
    this.visible = false;
    this.mesh.visible = false;
};

SoilCursor.prototype.setVisible = function(value) {
    this.mesh.visible = this.visible && value;
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

    this.intersect.normal = this.normalIntersection(this.intersect);

    var position = this.intersect.point.clone();

    var normal = this.intersect.normal.clone();
    this.intersect.object.localToWorld(normal);

    var top = position.clone().add(normal);

    this.mesh.position.copy(position);
    this.mesh.lookAt(top);

    if (this.app.interactionPublisher.isTouchDevice) {
        const dist = this.app.camera.position.distanceTo(position);
        const scale = dist * .55;
        this.mesh.scale.set(scale, scale, scale);
    } else {
        this.mesh.scale.set(1, 1, 1);
    }
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
        });
    });
};

SoilCursor.prototype.normalIntersection = function(intersect){
    var object = intersect.object;
    var geometry = object.geometry;
    var point = intersect.point.clone();
    var face = intersect.face;

    object.worldToLocal(point);

    var p1 = geometry.vertices[face.a];
    var p2 = geometry.vertices[face.b];
    var p3 = geometry.vertices[face.c];

    var normal1 = face.vertexNormals[0].clone();
    var normal2 = face.vertexNormals[1].clone();
    var normal3 = face.vertexNormals[2].clone();

    var barycoord = new THREE.Vector3();

    THREE.Triangle.barycoordFromPoint(point, p1, p2, p3, barycoord);

    normal1.multiplyScalar(barycoord.x);
    normal2.multiplyScalar(barycoord.y);
    normal3.multiplyScalar(barycoord.z);

    normal1.add(normal2).add(normal3);

    return normal1;
};

module.exports = SoilCursor;
