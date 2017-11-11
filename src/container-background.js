
const ContainerBackground = function(parent, app, geometry) {

    const material = new THREE.MeshBasicMaterial({
        color: 0x1c1833,
        side: THREE.BackSide,
        transparent: true,
        opacity: .75
    });

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    this.mesh = mesh;
};

ContainerBackground.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = ContainerBackground;
