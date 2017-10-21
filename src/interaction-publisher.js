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
};

InteractionPublisher.prototype.add = function(object, namespace) {
    this.objects.push(object);
    var state = {
        namespace: namespace,
        isOver: false
    };
    this.objectStates.push(state);
    this.objectStateMap[object.id] = state;
};

InteractionPublisher.prototype.mouseMove = function(event) {
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.rayCaster.setFromCamera(this.mousePosition, this.camera);

    const intersects = this.rayCaster.intersectObjects(this.objects);

    const touched = [];

    intersects.forEach(function(intersect) {
        const object = intersect.object;
        touched.push(object.id.toString());
        const state = this.objectStateMap[object.id];
        state.intersect = intersect;
        if ( ! state.isOver) {
            this.eventMediator.emit(state.namespace + '.mouseover', intersect);
            state.isOver = true;
        }
        this.eventMediator.emit(state.namespace + '.mousemove', intersect);
    }.bind(this));

    Object.entries(this.objectStateMap).forEach(function(kv) {
        const id = kv[0];
        const state = kv[1];
        if (touched.indexOf(id) == -1 && state.isOver) {
            this.eventMediator.emit(state.namespace + '.mouseout');
            state.isOver = false;
        }
    }.bind(this));
};

InteractionPublisher.prototype.mouseDown = function(event) {
    this.objectStates.forEach(function(state) {
        if (state.isOver) {
            this.eventMediator.emit(state.namespace + '.mousedown', state.intersect);
        }
    }.bind(this));
};

InteractionPublisher.prototype.mouseUp = function(event) {
    this.objectStates.forEach(function(state) {
        if (state.isOver) {
            this.eventMediator.emit(state.namespace + '.mouseup', state.intersect);
        }
    }.bind(this));
};

module.exports = InteractionPublisher;
