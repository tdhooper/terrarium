
const Autorotate = function(app, object) {

    this.app = app;
    this.object = object;

    this.speed = .000075;
    this.time = 0;
    this.rotation = 0;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.startAcceleration = .001;
    this.stopAcceleration = .005;
    this.direction = 1;

    app.eventMediator.on('soil.mouseover', this.interactBegin.bind(this));
    app.eventMediator.on('soil.touchstart', this.interactBegin.bind(this));

    app.eventMediator.on('soil.mouseout', this.interactEnd.bind(this));
    app.eventMediator.on('scene.touchend', this.interactEnd.bind(this));

    app.eventMediator.on('update', this.update.bind(this));

    var azimuth = 0;
    var azimuthMoving = false;
    app.eventMediator.on('camera.rotate.azimuth', newAzimuth => {
        newAzimuth += Math.PI;
        var delta = THREE.Math.euclideanModulo(
            azimuth - newAzimuth + Math.PI * 3,
            Math.PI * 2
        ) - Math.PI;
        if (Math.abs(delta) < .001) {
            if (azimuthMoving) {
                azimuthMoving = false;
                this.interactEnd();
            }
        } else if ( ! azimuthMoving) {
            azimuthMoving = true;
            this.interactBegin();
        }
        this.direction = delta < 0 ? -1 : 1;
        azimuth = newAzimuth;
    });

    app.eventMediator.on('crystal.growth', this.crystalGrowth.bind(this));
};

Autorotate.prototype.interactBegin = function() {
    this.pause();
};

Autorotate.prototype.interactEnd = function() {
    this.resume();
};

Autorotate.prototype.crystalGrowth = function() {
    this.wasRotating = false;
    this.stop();
    this.start(3000);
};

Autorotate.prototype.pause = function() {
    if (this.rotating) {
        this.wasRotating = true;
    }
    this.stop();
};

Autorotate.prototype.resume = function() {
    if (this.wasRotating) {
        this.wasRotating = false;
        this.start();
    } else if (this.wasWaiting) {
        this.wasWaiting = false;
        this.start(3000);
    } else if (this.delay) {
        this.stop();
        this.start(3000);
    }
};

Autorotate.prototype.start = function(delay) {
    if ( ! delay && ! this.rotating) {
        this.rotating = true;
        this.rotateOn();
    }
    if (delay && ! this.delay) {
        this.delay = setTimeout(() => {
            delete this.delay;
            this.start();
        }, delay);
    }
};

Autorotate.prototype.stop = function() {
    if (this.delay) {
        clearTimeout(this.delay);
        delete this.delay;
        this.wasWaiting = true;
    }
    if (this.rotating) {
        this.rotating = false;
        this.rotateOff();
    }
};

Autorotate.prototype.update = function() {
    const time = this.app.elapsed;
    const acceleration = this.rotating ? this.startAcceleration : this.stopAcceleration;
    const delta = time - this.time;
    this.time = time;
    const change = (this.targetSpeed - this.currentSpeed) * acceleration * delta;
    if (change > 0) {
        this.currentSpeed = Math.min(this.targetSpeed, this.currentSpeed + change);
    } else {
        this.currentSpeed = Math.max(this.targetSpeed, this.currentSpeed + change);
    }
    this.rotation += this.currentSpeed * delta;
    this.object.setRotation(this.rotation);
};

Autorotate.prototype.rotateOn = function() {
    this.targetSpeed = this.speed * this.direction;
};

Autorotate.prototype.rotateOff = function() {
    this.targetSpeed = 0;  
};

module.exports = Autorotate;
