
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
    event.preventDefault();
    if (this.isTouchDevice) {
        return;
    }

    var intersections = this.findIntersections(event);

    this.objectStates.forEach(function(state) {

        const hit = intersections.indexOf(state) !== -1;

        if (hit && ! state.isOver) {
            this.emit('mouseover', state);
            state.isOver = true;
        }

        if ( ! hit && state.isOver) {
            this.emit('mouseout', state, false);
            state.isOver = false;
        }

        if (hit) {
            this.emit('mousemove', state);
        }

    }.bind(this));

    this.emit('mousemove');
};

InteractionPublisher.prototype.mouseDown = function(event) {
    event.preventDefault();
    if (this.isTouchDevice) {
        return;
    }

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.emit('mousedown', state);
    }.bind(this));

    this.emit('mousedown');
};

InteractionPublisher.prototype.mouseUp = function(event) {
    event.preventDefault();
    if (this.isTouchDevice) {
        return;
    }

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.emit('mouseup', state);
    }.bind(this));

    this.emit('mouseup');
};

InteractionPublisher.prototype.touchHoldDown = function(state) {
    state.isTouchHoldDown = true;
    this.emit('touchholddown', state);
};

InteractionPublisher.prototype.touchStart = function(event) {
    event.preventDefault();
    this.isTouchDevice = true;

    if (event.touches.length > 1) {
        return;
    }
    event = event.touches[0];

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.emit('touchstart', state);
        state.isTouchDown = true;
        if ( ! state.isTouchHoldDown) {
            this.initTouchHold(event, state);
        }
    }.bind(this));

    this.emit('touchstart');
};

InteractionPublisher.prototype.initTouchHold = function(event, state) {
    state.touchStartPosition = this.eventPositionPx(event);
    var touchHoldDown = this.touchHoldDown.bind(this, state);
    state.touchHoldTimeout = setTimeout(touchHoldDown, this.TOUCH_HOLD_DELAY);
    this.emit('touchholdstart', state, false);
};

InteractionPublisher.prototype.touchMove = function(event) {
    event.preventDefault();
    event = event.touches[0];

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.emit('touchmove', state);
    }.bind(this));

    this.objectStates.forEach(function(state) {
        if ( ! state.isTouchHoldDown && state.touchHoldTimeout) {

            var position = this.eventPositionPx(event);
            var distance = state.touchStartPosition.distanceTo(position);

            if (distance < this.TOUCH_HOLD_ALLOW_MOVEMENT) {
                return;
            }

            clearTimeout(state.touchHoldTimeout);
            delete state.touchHoldTimeout;

            this.emit('touchholdend', state, false);
            this.initTouchHold(event, state);
        }
    }.bind(this));

    this.emit('touchmove');
};

InteractionPublisher.prototype.touchEnd = function(event) {
    event.preventDefault();
    event = event.changedTouches[0];

    this.objectStates.forEach(function(state) {
        if (state.isTouchDown) {
            state.isTouchDown = false;
        }
        if (state.touchHoldTimeout || state.isTouchHoldDown) {
            this.emit('touchholdend', state, false);
        }
        if (state.isTouchHoldDown) {
            state.isTouchHoldDown = false;
        }
        if (state.touchHoldTimeout) {
            clearTimeout(state.touchHoldTimeout);
            delete state.touchHoldTimeout;
        }
    }.bind(this));

    var intersections = this.findIntersections(event);
    intersections.forEach(function(state) {
        this.emit('touchend', state);
    }.bind(this));

    this.eventMediator.emit('scene.touchend');
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

    const rootMap = {};
    const objects = [];
    this.flattenObjects(this.objects, objects, rootMap);
    const intersections = this.rayCaster.intersectObjects(objects);

    shown.forEach(function(object) {
        object.visible = false;
    });

    const intersectedNamespaces = [];

    const intersectedStates = intersections.map(function(intersect) {
        const object = intersect.object;
        const id = rootMap[object.id];
        const state  = this.objectStateMap[id];
        state.intersect = intersect;
        intersectedNamespaces.push(state.namespace);
        return state;
    }.bind(this));

    intersectedStates.forEach(function(state) {
        state.alsoIntersected = intersectedNamespaces;
    });

    return intersectedStates;
};

InteractionPublisher.prototype.flattenObjects = function(objects, result, rootMap, rootId) {
    var len = objects.length;
    for (var i = 0; i < len; i++) {
        var object = objects[i];
        var id = rootId || object.id;
        if (object.children.length) {
            this.flattenObjects(object.children, result, rootMap, id);
        } else {
            result.push(object);
            rootMap[object.id] = id;
        }
    }
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

InteractionPublisher.prototype.emit = function(type, state, sendIntersection) {
    sendIntersection = sendIntersection !== undefined ? sendIntersection : true;
    const namespace = state ? state.namespace : 'scene';
    const name = [namespace, type].join('.');
    if (state && sendIntersection) {
        this.eventMediator.emit(name, state.intersect, state.alsoIntersected);
    } else {
        this.eventMediator.emit(name);
    }
};

module.exports = InteractionPublisher;
