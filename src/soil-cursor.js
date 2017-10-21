const THREE = require('three');

const SoilCursor = function(parent, app) {

    const geometry = new THREE.SphereGeometry(.05);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;

    parent.add(mesh);

    app.eventMediator.on('soil.mouseover', function() {
        mesh.visible = true;
    });

    app.eventMediator.on('soil.mousemove', function(intersect) {
        var position = intersect.point.clone();
        parent.worldToLocal(position);
        mesh.position.copy(position);
    });

    app.eventMediator.on('soil.mouseout', function() {
        mesh.visible = false;
    });

    app.eventMediator.on('soil.mousedown', function() {
        material.color.setHex(0x00ff00);
    });

    app.eventMediator.on('soil.mouseup', function() {
        material.color.setHex(0xff0000);
    });
};

module.exports = SoilCursor;
