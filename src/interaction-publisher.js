const THREE = require('three');


const InteractionPublisher = function(
    camera,
    eventMediator
) {
    this.camera = camera;
    this.eventMediator = eventMediator;
    this.rayCaster = new THREE.Raycaster();
    this.mousePosition = new THREE.Vector2();
    this.objects = [];
    this.objectStates = [];
    this.objectStateMap = {};
    document.addEventListener('mousemove', this.mouseMove.bind(this), false);
    document.addEventListener('mousedown', this.mouseDown.bind(this), false);
    document.addEventListener('mouseup', this.mouseUp.bind(this), false);
    document.addEventListener('touchstart', this.touchHandler(this.mouseDown.bind(this)), false);
    document.addEventListener('touchend', this.touchHandler(this.mouseUp.bind(this)), false);
};

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

InteractionPublisher.prototype.findIntersections = function(event) {
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.rayCaster.setFromCamera(this.mousePosition, this.camera);

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

module.exports = InteractionPublisher;
