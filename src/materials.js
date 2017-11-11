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
        scale: {type: 'f'},
        flash: {type: 'f', value: 1}
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
makeShadable(soilTop);

var insertPlace, insert;

soilTop.vertexShader = insertGlsl(
    soilTop.vertexShader,
    '#include <common>',
    'varying vec3 vPosition;'
);

soilTop.vertexShader = insertGlsl(
    soilTop.vertexShader,
    '#include <uv_vertex>',
    'vPosition = position;'
);

soilTop.fragmentShader = insertGlsl(
    soilTop.fragmentShader,
    '#include <common>',
    [
        'varying vec3 vPosition;',
        'uniform float time;',
        'uniform vec3 highlightColor3;'
    ].join('\n')
);

soilTop.fragmentShader = insertGlsl(
    soilTop.fragmentShader,
    '#include <color_fragment>',
    [
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
    ].join('\n')
);

const highlightColor = new THREE.Color(0xFC38A3);

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


const stars = new THREE.PointsMaterial({
    transparent: true
});
makeShadable(stars);

stars.extensions = {derivatives: true};
stars.sizeAttenuation = false;

stars.vertexShader = insertGlsl(
    stars.vertexShader,
    '#include <common>',
    [
        'attribute float aSize;',
        'attribute float aSeed;',
        'uniform vec2 uResolution;',
        'varying float vSeed;',
    ].join('\n')
);

stars.vertexShader = insertGlsl(
    stars.vertexShader,
    '#include <color_vertex>',
    [
        'float sizeRez = min(uResolution.x, uResolution.y) * .005;',
        'vSeed = aSeed;'
    ].join('\n')
);

stars.vertexShader = stars.vertexShader.replace(/gl_PointSize = size/g, 'gl_PointSize = (aSize * sizeRez)');

stars.fragmentShader = insertGlsl(
    stars.fragmentShader,
    '#include <common>',
    [
        glslify('./shaders/lib/spectrum.glsl'),
        glslify('./shaders/lib/gamma.glsl'),
        glslify('./shaders/lib/hash11.glsl'),
        'varying float vSeed;',
        'uniform float time;'
    ].join('\n')
);

stars.fragmentShader = insertGlsl(
    stars.fragmentShader,
    '#include <color_fragment>',
    [
        'vec2 cxy = 2.0 * gl_PointCoord - 1.0;',
        'float r = dot(cxy, cxy);',
        'float delta = fwidth(r);',
        'diffuseColor.a = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);',
        'diffuseColor.xyz = spectrum(vSeed + time * ceil(vSeed * 6.));',
        'diffuseColor.xyz = mix(diffuseColor.xyz, vec3(1), hash11(vSeed));'
    ].join('\n')
);

stars.uniforms.uResolution = {type: 'v2'};
stars.uniforms.time = {type: 'float', value: 0};

module.exports.stars = stars;


function makeShadable(material) {
    const shaderIDs = {
        MeshDepthMaterial: 'depth',
        MeshDistanceMaterial: 'distanceRGBA',
        MeshNormalMaterial: 'normal',
        MeshBasicMaterial: 'basic',
        MeshLambertMaterial: 'lambert',
        MeshPhongMaterial: 'phong',
        MeshToonMaterial: 'phong',
        MeshStandardMaterial: 'physical',
        MeshPhysicalMaterial: 'physical',
        LineBasicMaterial: 'basic',
        LineDashedMaterial: 'dashed',
        PointsMaterial: 'points',
        ShadowMaterial: 'shadow'
    };
    const shaderId = shaderIDs[material.type];
    const shader = THREE.ShaderLib[shaderId];
    material.type = 'ShaderMaterial';
    material.vertexShader = shader.vertexShader;
    material.fragmentShader = shader.fragmentShader;
    material.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
}

function insertGlsl(glsl, place, insert, before) {
    if (before) {
        return glsl.replace(place, insert + '\n' + place);
    }
    var a = glsl.replace(place, place + '\n' + insert);
    return a;
}
