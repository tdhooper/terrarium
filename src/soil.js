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

    var material = new THREE.MeshPhongMaterial();
    material.type = 'ShaderMaterial';
    material.vertexShader = THREE.ShaderLib.phong.vertexShader;
    material.fragmentShader = THREE.ShaderLib.phong.fragmentShader;

    var insertPlace, insert;

    insertPlace = '#include <common>';
    insert = 'varying vec3 vPosition;';
    material.vertexShader = material.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

    insertPlace = '#include <uv_vertex>';
    insert = 'vPosition = position;';
    material.vertexShader = material.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

    insertPlace = '#include <common>';
    insert = [
        'varying vec3 vPosition;',
        'uniform float time;',
        'uniform vec3 highlightColor3;'
    ].join('\n');
    material.fragmentShader = material.fragmentShader.replace(insertPlace, insertPlace + '\n' + insert);

    insertPlace = '#include <color_fragment>';
    insert = [
        'float magnitude = length(vPosition.xz);',
        'vec4 highlightColor = vec4(highlightColor3,1);',
        'float highlightAnim = magnitude * 35. + time * -40.;',
        'float highlight = sin(highlightAnim) * .5 + .5;',
        'float highlightSize = mix(.2, 1., magnitude * 1.2);',
        'highlightSize = pow(highlightSize, .5);',
        'float highlightInterval = 5.;',
        'float highlightInterval2 = 10.;',
        'float highlightGap = sin(highlightAnim / highlightInterval) * .5 + .5;',
        'highlightGap = step(highlightGap, .5);',
        'float highlightGap2 = sin(highlightAnim / highlightInterval2) * .5 + .5;',
        'highlightGap2 = step(highlightGap2, .5);',
        'highlightGap = highlightGap * highlightGap2;',
        'float highlightFade = min(pow(magnitude * 1.5, 2.), 1.);',
        'float highlightStep = (1. - highlightSize) * highlightGap;',
        'diffuseColor = mix(diffuseColor, highlightColor, step(highlight, highlightStep) * (1. - highlightFade));'
    ].join('\n');
    material.fragmentShader = material.fragmentShader.replace(insertPlace, insertPlace + '\n' + insert);

    const highlightColor = new THREE.Color(0xFC38A3);

    var shader = THREE.ShaderLib.phong;
    material.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    material.uniforms.time = {type: 'f', value: 0};
    material.uniforms.highlightColor3 = {type: 'v3', value: highlightColor.toArray()};

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
