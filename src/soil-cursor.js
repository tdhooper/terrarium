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
        mesh.position.copy(intersect.point);
    });

    app.eventMediator.on('soil.mouseout', function() {
        mesh.visible = false;
    });
};

module.exports = SoilCursor;
