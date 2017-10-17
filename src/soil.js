const THREE = require('three');
const ThreeBSP = require('./lib/three-js-csg')(THREE);


const Soil = function(parent, container) {

    container.computeBoundingBox()
    const size = container.boundingBox.getSize();

    this.width = size.x;
    this.depth = size.z;
    this.height = size.y * .1;
    this.offset = size.y * .2;

    const surface = new THREE.ParametricGeometry(
        this.generate.bind(this),
        25, 25
    );

    const containerBSP = new ThreeBSP(container);
    const surfaceBSP = new ThreeBSP(surface);
    const geomBSP = containerBSP.intersect(surfaceBSP);
    const geometry = geomBSP.toGeometry();

    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    parent.add(mesh);

    var clickableBSP = surfaceBSP.cut(containerBSP);
    var clickableGeom = clickableBSP.toGeometry();

};

Soil.prototype.generate = function(u, v) {
    const z = (u - .5) * this.width;
    const x = (v - .5) * this.depth;
    var y = Math.sin(x * 5) * Math.sin(z * 2) * .5 * this.height;
    y -= this.offset;
    return new THREE.Vector3(x, y, z);
};

module.exports = Soil;
