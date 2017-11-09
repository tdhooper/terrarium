const THREE = require('three');
const ThreeBSP = require('./lib/three-js-csg')(THREE);
const sliceGeometry = require('threejs-slice-geometry')(THREE);
var glslify = require('glslify');


const Soil = function(parent, container, app) {

    container.computeBoundingBox();
    const size = container.boundingBox.getSize();

    this.width = size.x;
    this.depth = size.z;
    this.height = size.y * .1;
    this.offset = size.y * .2;

    var bottomMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 0
    });

    var material = new THREE.MeshPhongMaterial({
        flatShading: true
    });
    material.type = 'ShaderMaterial';
    material.vertexShader = THREE.ShaderLib.phong.vertexShader;
    material.fragmentShader = THREE.ShaderLib.phong.fragmentShader;

    var insertPlace, insert;

    insertPlace = '#include <displacementmap_pars_vertex>';
    insert = 'uniform float time;';
    material.vertexShader = material.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

    insertPlace = '#include <displacementmap_vertex>';
    insert = [
        'float magnitude = max(.8 - length(position.xz), 0.);',
        'transformed += normalize( objectNormal ) * sin(sin(magnitude) * 40. + time * 5.) * magnitude * .1;'
    ].join('\n');
    material.vertexShader = material.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

    console.log(material.vertexShader);

    var shader = THREE.ShaderLib.phong;
    material.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    material.uniforms.time = {type: 'f', value: 0};

    new app.TWEEN.Tween(material.uniforms.time)
        .to({value: '+1'})
        .repeat(Infinity)
        .start();

    const surface = new THREE.ParametricGeometry(
        this.generate.bind(this),
        55, 55
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
