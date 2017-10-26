const THREE = require('three');


const InteractionPublisher = function(
    element,
    camera,
    eventMediator,
    log
) {
    this.camera = camera;
    this.eventMediator = eventMediator;
    this.log = log;
    this.rayCaster = new THREE.Raycaster();
    this.objects = [];
    this.objectStates = [];
    this.objectStateMap = {};
    this.showObjects = [];
    this.isTouchDevice = false;
    element.addEventListener('mousemove', this.mouseMove.bind(this), false);
    element.addEventListener('mousedown', this.mouseDown.bind(this), false);
    element.addEventListener('mouseup', this.mouseUp.bind(this), false);
    element.addEventListener('touchstart', this.touchStart.bind(this), false);
    element.addEventListener('touchmove', this.touchMove.bind(this), false);
    element.addEventListener('touchend', this.touchEnd.bind(this), false);
};

InteractionPublisher.prototype.TOUCH_HOLD_DELAY = 500;
InteractionPublisher.prototype.TOUCH_HOLD_ALLOW_MOVEMENT = 10; // Pixels

InteractionPublisher.prototype.add = function(object, namespace, alwaysVisible) {
    this.objects.push(object);
    var state = {
        namespace: namespace,
        isOver: false,
        isDown: false,
        isTouchDown: false,
        isTouchHoldDown: false
    };
    this.objectStates.push(state);
    this.objectStateMap[object.id] = state;
    if (alwaysVisible) {
        this.show(object);
    }
};

InteractionPublisher.prototype.show = function(object) {
    this.showObjects.push(object);
};

InteractionPublisher.prototype.mouseMove = function(event) {
    if (this.isTouchDevice) {
        return;
    }

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
    if (this.isTouchDevice) {
        return;
    }

    var intersections = this.findIntersections(event);

    intersections.forEach(function(state) {

        this.eventMediator.emit(state.namespace + '.mousedown', state.intersect);
        state.isDown = true;

    }.bind(this));
};

InteractionPublisher.prototype.mouseUp = function(event) {
    if (this.isTouchDevice) {
        return;
    }

    this.objectStates.forEach(function(state) {

        if (state.isDown) {
            this.eventMediator.emit(state.namespace + '.mouseup');
            state.isDown = false;
        }

    }.bind(this));
};

InteractionPublisher.prototype.touchHoldDown = function(state) {
    state.isTouchHoldDown = true;
    this.eventMediator.emit(state.namespace + '.touchholddown', state.intersect);
};

InteractionPublisher.prototype.touchStart = function(event) {
    this.isTouchDevice = true;

    if (event.touches.length > 1) {
        return;
    }
    var event = event.touches[0];

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.eventMediator.emit(state.namespace + '.touchstart', state.intersect);
        state.isTouchDown = true;
        if ( ! state.isTouchHoldDown) {
            this.initTouchHold(event, state);
        }
    }.bind(this));
};

InteractionPublisher.prototype.initTouchHold = function(event, state) {
    state.touchStartPosition = this.eventPositionPx(event);
    var touchHoldDown = this.touchHoldDown.bind(this, state);
    state.touchHoldTimeout = setTimeout(touchHoldDown, this.TOUCH_HOLD_DELAY);
    this.eventMediator.emit(state.namespace + '.touchholdstart', state.intersect);
}

InteractionPublisher.prototype.touchMove = function(event) {
    var event = event.touches[0];

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.eventMediator.emit(state.namespace + '.touchmove', state.intersect);
    }.bind(this));

    this.objectStates.forEach(function(state) {
        if ( ! state.isTouchHoldDown && state.touchHoldTimeout) {

            var position = this.eventPositionPx(event);
            var distance = state.touchStartPosition.distanceTo(position);

            if (distance < this.TOUCH_HOLD_ALLOW_MOVEMENT) {
                return;
            }

            clearTimeout(state.touchHoldTimeout);

            this.eventMediator.emit(state.namespace + '.touchholdend');
            this.initTouchHold(event, state);
        }
    }.bind(this));
};

InteractionPublisher.prototype.touchEnd = function(event) {
    var event = event.touches[0];

    this.objectStates.forEach(function(state) {
        if (state.isTouchDown) {
            this.eventMediator.emit(state.namespace + '.touchend');
            state.isTouchDown = false;
        }
        if (state.touchHoldTimeout || state.isTouchHoldDown) {
            this.eventMediator.emit(state.namespace + '.touchholdend');
        }
        if (state.isTouchHoldDown) {
            state.isTouchHoldDown = false;
        }
        if (state.touchHoldTimeout) {
            clearTimeout(state.touchHoldTimeout);
        }
    }.bind(this));
};

InteractionPublisher.prototype.findIntersections = function(event) {
    var mousePosition = this.eventPosition(event);
    this.rayCaster.setFromCamera(mousePosition, this.camera);

    var shown = this.showObjects.filter(function(object) {
        if ( ! object.visible) {
            object.visible = true;
            return true;
        }
    });

    const intersections = this.rayCaster.intersectObjects(this.objects);
    
    shown.forEach(function(object) {
        object.visible = false;
    });

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
