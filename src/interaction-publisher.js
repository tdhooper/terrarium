const THREE = require('three');
const InlineLog = require('./inline-log');


const InteractionPublisher = function(
    camera,
    eventMediator
) {
    this.camera = camera;
    this.eventMediator = eventMediator;
    this.rayCaster = new THREE.Raycaster();
    this.objects = [];
    this.objectStates = [];
    this.objectStateMap = {};
    document.addEventListener('mousemove', this.mouseMove.bind(this), false);
    document.addEventListener('mousedown', this.mouseDown.bind(this), false);
    document.addEventListener('mouseup', this.mouseUp.bind(this), false);
    document.addEventListener('touchstart', this.touchStart.bind(this), false);
    document.addEventListener('touchmove', this.touchMove.bind(this), false);
    document.addEventListener('touchend', this.touchEnd.bind(this), false);
};

InteractionPublisher.prototype.TOUCH_HOLD_DELAY = 250;
InteractionPublisher.prototype.TOUCH_HOLD_ALLOW_MOVEMENT = 10; // Pixels

InteractionPublisher.prototype.add = function(object, namespace) {
    this.objects.push(object);
    var state = {
        namespace: namespace,
        isOver: false,
        isDown: false
    };
    this.objectStates.push(state);
    this.objectStateMap[object.id] = state;
};

InteractionPublisher.prototype.mouseMove = function(event) {
    var intersections = this.findIntersections(event);

    this.objectStates.forEach(function(state) {

        const hit = intersections.indexOf(state) !== -1;

        if (hit && ! state.isOver) {
            this.eventMediator.emit(state.namespace + '.mouseover', state.intersect);
            state.isOver = true;
        }

        if ( ! hit && state.isOver) {
            this.eventMediator.emit(state.namespace + '.mouseout');
            state.isOver = false;
        }

        if (hit) {
            this.eventMediator.emit(state.namespace + '.mousemove', state.intersect);
        }

    }.bind(this));
};

InteractionPublisher.prototype.mouseDown = function(event) {

    var intersections = this.findIntersections(event);

    this.objectStates.forEach(function(state) {

        const hit = intersections.indexOf(state) !== -1;

        if (hit) {
            this.eventMediator.emit(state.namespace + '.mousedown', state.intersect);
            state.isDown = true;
        }

    }.bind(this));
};

InteractionPublisher.prototype.mouseUp = function(event) {

    this.objectStates.forEach(function(state) {

        if (state.isDown) {
            this.eventMediator.emit(state.namespace + '.mouseup');
            state.isDown = false;
        }

    }.bind(this));
};

InteractionPublisher.prototype.touchStart = function(event) {
    if (event.touches.length > 1) {
        return;
    }
    var event = event.touches[0];
    this.touchStartPosition = this.eventPositionPx(event);
    var mouseDown = this.mouseDown.bind(this, event);
    this.touchHoldTimeout = setTimeout(mouseDown, this.TOUCH_HOLD_DELAY);
};

InteractionPublisher.prototype.touchMove = function(event) {
    if ( ! this.touchHoldTimeout) {
        return;
    }
    var event = event.touches[0];
    var position = this.eventPositionPx(event);
    var distance = this.touchStartPosition.distanceTo(position);
    if (distance > this.TOUCH_HOLD_ALLOW_MOVEMENT) {
        clearTimeout(this.touchHoldTimeout)
    }
};

InteractionPublisher.prototype.touchEnd = function(event) {
    if ( ! this.touchHoldTimeout) {
        return;
    }
    clearInterval(this.touchHoldTimeout);
};

InteractionPublisher.prototype.findIntersections = function(event) {
    var mousePosition = this.eventPosition(event);
    this.rayCaster.setFromCamera(mousePosition, this.camera);

    const intersections = this.rayCaster.intersectObjects(this.objects);

    const intersectedStates = intersections.map(function(intersect) {
        const object = intersect.object;
        const state  = this.objectStateMap[object.id];
        state.intersect = intersect;
        return state;
    }.bind(this));

    return intersectedStates;
};

InteractionPublisher.prototype.touchHandler = function(handler) {
    return function(event) {
        handler(event.touches[0]);
    };
};

InteractionPublisher.prototype.eventPosition = function(event) {
    return new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
};

InteractionPublisher.prototype.eventPositionPx = function(event) {
    return new THREE.Vector2(event.clientX, event.clientY);
};

module.exports = InteractionPublisher;
