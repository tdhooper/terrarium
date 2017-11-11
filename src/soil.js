const ThreeBSP = require('./lib/three-js-csg')(THREE);
const sliceGeometry = require('threejs-slice-geometry')(THREE);

var materials = require('./materials');


const Soil = function(parent, container, app) {

    container.computeBoundingBox();
    const size = container.boundingBox.getSize();

    this.width = size.x;
    this.depth = size.z;
    this.height = size.y * .1;
    this.offset = size.y * .2;

    var bottomMaterial = materials.soilBottom;

    var material = materials.soilTop;
    this.highlightActive = material.uniforms.highlightActive;

    var TWEEN = app.TWEEN;

    this.highlightTween = new TWEEN.Tween(material.uniforms.time)
        .to({value: 1}, 2000)
        .repeat(Infinity);

    const surface = new THREE.ParametricGeometry(
        this.generate.bind(this),
        15, 15
    );

    const containerBSP = new ThreeBSP(container);
    const surfaceBSP = new ThreeBSP(surface);

    // Top
    var topGeom = surface.clone();
    container.faces.forEach((face, i) => {
        var plane = new THREE.Plane().setFromCoplanarPoints(
            container.vertices[face.b],
            container.vertices[face.a],
            container.vertices[face.c]
        );
        topGeom = sliceGeometry(topGeom, plane);
    });
    const top = new THREE.Mesh(topGeom, material);
    top.receiveShadow = true;
    parent.add(top);

    // Bottom
    var bottomBSP = containerBSP.cut(surfaceBSP);
    var bottomGeom = bottomBSP.toGeometry();
    const bottom = new THREE.Mesh(bottomGeom, bottomMaterial);
    bottom.receiveShadow = true;
    parent.add(bottom);

    this.top = top;
    this.bottom = bottom;

    app.interactionPublisher.add(top, 'soil', true);
};

Soil.prototype.showHighlight = function(enable) {
    if (enable) {
        this.highlightTween.start();
    } else {
        this.highlightTween.repeat(0);
    }
};

Soil.prototype.generate = function(u, v) {
    const z = (u - .5) * this.width;
    const x = (v - .5) * this.depth;
    var y = Math.sin(x * 5) * Math.sin(z * 2) * .5 * this.height;
    y -= this.offset;
    return new THREE.Vector3(x, y, z);
};

Soil.prototype.setVisible = function(value) {
    this.top.visible = value;
    this.bottom.visible = value;
};

module.exports = Soil;
