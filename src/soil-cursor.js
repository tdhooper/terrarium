var materials = require('./materials');


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

    const material = materials.soilCursor;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;

    parent.add(mesh);

    this.parent = parent;
    this.app = app;
    this.mesh = mesh;
    this.material = material;

    app.eventMediator.on('ready', this.enable.bind(this));

    app.eventMediator.on('soil.mouseover', this.show.bind(this));
    app.eventMediator.on('soil.touchstart', this.show.bind(this));

    app.eventMediator.on('soil.mousemove', this.position.bind(this));
    app.eventMediator.on('soil.touchstart', this.position.bind(this)); // TODO make touch/mouse over/move behave the same

    app.eventMediator.on('soil.mouseout', this.hide.bind(this));
    app.eventMediator.on('soil.touchend', this.hide.bind(this));

    app.eventMediator.on('crystal.growth', this.showProgress.bind(this));

    this.countdownTween = new app.TWEEN.Tween(material.uniforms.t1)
        .to(
            {value: 1},
            app.interactionPublisher.TOUCH_HOLD_DELAY
        )
        .easing(app.TWEEN.Easing.Quadratic.In);
};

SoilCursor.prototype.enable = function() {
    if (this.enabled) {
        return;
    }

    this.enabled = true;

    const app = this.app;

    app.eventMediator.on('soil.touchholdstart', this.startCountdown.bind(this));
    app.eventMediator.on('soil.touchholdend', this.resetCountdown.bind(this));

    app.eventMediator.on('soil.mousedown', this.highlightOn.bind(this));
    app.eventMediator.on('soil.touchholddown', this.highlightOn.bind(this));

    app.eventMediator.on('soil.mouseup', this.highlightOff.bind(this));
    app.eventMediator.on('soil.touchend', this.highlightOff.bind(this));

};

SoilCursor.prototype.setRenderOnTop = function(value) {
    if (value) {
        this.material.depthTest = false;
        this.mesh.renderOrder = 1;
    } else {
        this.material.depthTest = true;
        this.mesh.renderOrder = 0;
    }
    this.renderOnTop = value;
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
    if ( ! this.enabled) {
        if ( ! this.readyShowHandler) {
            this.readyShowHandler = this.show.bind(this);
            this.app.eventMediator.on('ready', this.readyShowHandler);
        }
        return;
    }
    this.isOver = true;
    this.visible = true;
    this.mesh.visible = true;
};

SoilCursor.prototype.hide = function() {
    if ( ! this.enabled) {
        this.readyShowHandler && this.app.eventMediator.removeListener('ready', this.readyShowHandler);
        return;
    }
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
