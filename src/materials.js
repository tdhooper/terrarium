var glslify = require('glslify');


const front = new THREE.Color(0x70a8f3);
const back = new THREE.Color(0x322f57);

back.lerp(front, .25);

module.exports.containerWireframe = new THREE.ShaderMaterial({
    vertexShader: glslify('./shaders/container.vert'),
    fragmentShader: glslify('./shaders/container.frag'),
    vertexColors: THREE.VertexColors,
    uniforms: {
        frontColor: {type: 'v3', value: front.toArray()},
        backColor: {type: 'v3', value: back.toArray()}
    }
});


module.exports.containerBack = new THREE.MeshBasicMaterial({
    color: 0x1c1833,
    side: THREE.BackSide,
    transparent: true,
    opacity: .75
});


module.exports.crystal = new THREE.ShaderMaterial({
    vertexShader: glslify('./shaders/crystal.vert'),
    fragmentShader: glslify('./shaders/crystal.frag'),
    fog: true,
    uniforms: {
        fogColor: {type: 'c'},
        fogDensity: {type: 'f'},
        seed: {type: 'f'},
        bottomClip: {type: 'f'},
        height: {type: 'f'},
        scale: {type: 'f'}
    }
});

module.exports.soilCursor = new THREE.ShaderMaterial({
    uniforms: {
        t1: {value: 0},
        t2: {value: 0}
    },
    vertexShader: glslify('./shaders/cursor.vert'),
    fragmentShader: glslify('./shaders/cursor.frag'),
    side: THREE.DoubleSide
});


module.exports.soilBottom = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 0
});

const soilTop = new THREE.MeshPhongMaterial();
soilTop.type = 'ShaderMaterial';
soilTop.vertexShader = THREE.ShaderLib.phong.vertexShader;
soilTop.fragmentShader = THREE.ShaderLib.phong.fragmentShader;

var insertPlace, insert;

insertPlace = '#include <common>';
insert = 'varying vec3 vPosition;';
soilTop.vertexShader = soilTop.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

insertPlace = '#include <uv_vertex>';
insert = 'vPosition = position;';
soilTop.vertexShader = soilTop.vertexShader.replace(insertPlace, insertPlace + '\n' + insert);

insertPlace = '#include <common>';
insert = [
    'varying vec3 vPosition;',
    'uniform float time;',
    'uniform vec3 highlightColor3;'
].join('\n');
soilTop.fragmentShader = soilTop.fragmentShader.replace(insertPlace, insertPlace + '\n' + insert);

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
soilTop.fragmentShader = soilTop.fragmentShader.replace(insertPlace, insertPlace + '\n' + insert);

const highlightColor = new THREE.Color(0xFC38A3);

var shader = THREE.ShaderLib.phong;
soilTop.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
soilTop.uniforms.time = {type: 'f', value: 0};
soilTop.uniforms.highlightColor3 = {type: 'v3', value: highlightColor.toArray()};

module.exports.soilTop = soilTop;


const planetColor = new THREE.Color(0x5cbcff);

module.exports.planetSolid = new THREE.MeshPhongMaterial({
    color: planetColor,
    transparent: true,
    opacity: .5
});

module.exports.planetWireframe = new THREE.LineBasicMaterial({
    color: planetColor
});
