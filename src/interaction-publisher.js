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
    this.objectMap = {};
    document.addEventListener('mousemove', this.mouseMove.bind(this), false);
};

InteractionPublisher.prototype.add = function(object, namespace) {
    this.objects.push(object);
    this.objectMap[object.id] = {
        namespace: namespace,
        isOver: false
    };
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
        const spec = this.objectMap[object.id];
        if ( ! spec.isOver) {
            this.eventMediator.emit(spec.namespace + '.mouseover', intersect);
            spec.isOver = true;
        }
        this.eventMediator.emit(spec.namespace + '.mousemove', intersect);
    }.bind(this));

    Object.entries(this.objectMap).forEach(function(kv) {
        const id = kv[0];
        const spec = kv[1];
        if (touched.indexOf(id) == -1 && spec.isOver) {
            this.eventMediator.emit(spec.namespace + '.mouseout');
            spec.isOver = false;
        }
    }.bind(this));

};

module.exports = InteractionPublisher;
