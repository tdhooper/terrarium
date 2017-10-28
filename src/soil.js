const THREE = require('three');
const ThreeBSP = require('./lib/three-js-csg')(THREE);


const Soil = function(parent, container, app) {

    container.computeBoundingBox();
    const size = container.boundingBox.getSize();

    this.width = size.x;
    this.depth = size.z;
    this.height = size.y * .1;
    this.offset = size.y * .2;

    const material = new THREE.MeshNormalMaterial();

    const surface = new THREE.ParametricGeometry(
        this.generate.bind(this),
        25, 25
    );

    const containerBSP = new ThreeBSP(container);
    const surfaceBSP = new ThreeBSP(surface);


    // Visible soil

    const geomBSP = containerBSP.intersect(surfaceBSP);
    const geometry = geomBSP.toGeometry();
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    this.mesh = mesh;


    // Interactive area of the soil

    var interactiveBSP = surfaceBSP.cut(containerBSP);
    var interactiveGeom = interactiveBSP.toGeometry();
    var interactiveMesh = new THREE.Mesh(interactiveGeom, material);
    interactiveMesh.visible = false;
    parent.add(interactiveMesh);

    app.interactionPublisher.add(interactiveMesh, 'soil-area', true);


    // Clean normals for the soil

    surface.computeFaceNormals();
    var normalMesh = new THREE.Mesh(surface, material);
    normalMesh.visible = false;
    parent.add(normalMesh);

    app.interactionPublisher.add(normalMesh, 'soil-normals', true);
};

Soil.prototype.generate = function(u, v) {
    const z = (u - .5) * this.width;
    const x = (v - .5) * this.depth;
    var y = Math.sin(x * 5) * Math.sin(z * 2) * .5 * this.height;
    y -= this.offset;
    return new THREE.Vector3(x, y, z);
};

Soil.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Soil;
