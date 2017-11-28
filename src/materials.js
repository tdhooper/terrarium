const glslify = require('glslify');

const white = new THREE.Color(0xffffff);

const ShadablePointsMaterial = ShadableMixin(THREE.PointsMaterial);
const ShadablePhongMaterial = ShadableMixin(THREE.MeshPhongMaterial);
const ShadableMeshBasicMaterial = ShadableMixin(THREE.MeshBasicMaterial);


/* Instanced
   ========================================================================== */

const instancedHead = [
    'attribute vec3 instancePosition;',
    'attribute vec4 instanceQuaternion;',
    'attribute vec3 instanceScale;',
    'attribute float instanceVariant;',
    'varying float vVariant;',
    'vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {',
        'position *= scale;',
        'position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );',
        'return position + translation;',
    '}'
].join('\n');

const instancedBody = [
    'transformed = applyTRS(transformed.xyz, instancePosition, instanceQuaternion, instanceScale);',
    'vVariant = instanceVariant;'
].join('\n');


/* Hyper
   ========================================================================== */

const calcHyperPower = [
    'varying vec2 screenUv;',
    'uniform vec4 hyperMap;',
    'uniform vec2 uResolution;',
    glslify('./shaders/lib/hyper-value.glsl'),
    'float calcHyperPower(vec3 hyperPos) {',
        'vec2 xy = uResolution.xy;', 
        'vec2 ratio = xy / sqrt(pow(xy.x, 2.) + pow(xy.y, 2.));',
        'float radial = length(screenUv * ratio);',
        'float sphere = length(hyperPos / 90.); //35',
        'float offset = mix(radial, sphere, .95);',
        'float t = hyperValue(hyperMap, offset);',
        'return t;',
    '}',
    'float calcHyperPowerRadial() {',
        'vec2 xy = uResolution.xy;', 
        'vec2 ratio = xy / sqrt(pow(xy.x, 2.) + pow(xy.y, 2.));',
        'float radial = length(screenUv * ratio);',
        'float offset = radial;',
        'float t = hyperValueSmooth(hyperMap, offset);',
        'return t;',
    '}',
].join('\n');

const hyperVertHead = [
    'uniform float time;',
    'varying vec3 hyperPos;',
    calcHyperPower
].join('\n');

const hyperVertDeform = [
    'hyperPos = (modelMatrix * vec4( transformed, 1.0 )).xyz;',
    'float hyperPower = calcHyperPower(hyperPos);',
    'float dist = length(hyperPos / 400.) + .01;',
    'float str = hyperPower;',
    'transformed += sin(hyperPos * dist * 400. + time * 100.) * dist * str;',
].join('\n');

const hyperVertBody = [
    'screenUv = gl_Position.xy / gl_Position.w;',
].join('\n');

const hyperFragHead = [
    'varying vec3 hyperPos;',
    'uniform float time;',
    calcHyperPower,
    glslify('./shaders/lib/spectrum.glsl'),
    glslify('./shaders/lib/gamma.glsl'),
    'vec3 hyperColor(vec3 color) {',
        'float hyperPower = calcHyperPower(hyperPos);',
        'hyperPower = max(0., hyperPower * 2. - 1.);',
        'float t = hyperPower;',
        'float dist = pow(length(hyperPos), 1./4.);',
        'vec3 col = spectrum(dist * 4. - time * .5);',
        'col = linearToScreen(col);',
        'return mix(color, col, t);',
    '}',
].join('\n');

const hyperFragBody = 'gl_FragColor.rgb = hyperColor(gl_FragColor.rgb);';

module.exports.addHyperMap = function(hyperMap) {
    planetSolid.enableHyper(hyperMap.dataTexture);
    planetBackground.enableHyper(hyperMap.dataTexture);
    planetWireframe.enableHyper(hyperMap.dataTexture);
    soilTop.enableHyper(hyperMap.dataTexture);
    soilBottom.enableHyper(hyperMap.dataTexture);
    containerWireframe.enableHyper(hyperMap.dataTexture);
    crystal.enableHyper(hyperMap.dataTexture);
    background.enableHyper(hyperMap.dataTexture, true);
};

module.exports.setResolution = function(x, y) {
    var xy = [x, y];
    stars.uniforms.uResolution.value = xy;
    planetSolid.uniforms.uResolution.value = xy;
    planetBackground.uniforms.uResolution.value = xy;
    planetWireframe.uniforms.uResolution.value = xy;
    soilTop.uniforms.uResolution.value = xy;
    soilBottom.uniforms.uResolution.value = xy;
    containerWireframe.uniforms.uResolution.value = xy;
    crystal.uniforms.uResolution.value = xy;
    background.uniforms.uResolution.value = xy;
};

module.exports.setTime = function(time) {
    stars.uniforms.time.value = time;
    planetSolid.uniforms.time.value = time;
    planetBackground.uniforms.time.value = time;
    planetWireframe.uniforms.time.value = time;
    soilTop.uniforms.time.value = time;
    soilBottom.uniforms.time.value = time;
    containerWireframe.uniforms.time.value = time;
    crystal.uniforms.time.value = time;
    background.uniforms.time.value = time;
};


/* Container
   ========================================================================== */

const front = new THREE.Color(0x70a8f3);
const back = new THREE.Color(0x322f57);

back.lerp(front, .25);

const containerWireframe = new ShadablePhongMaterial({
    vertexColors: THREE.VertexColors
});

containerWireframe.uniforms.frontColor = {type: 'v3', value: front.toArray()};
containerWireframe.uniforms.backColor = {type: 'v3', value: back.toArray()};

containerWireframe.updateVertexShader(
    '#include <common>',
    'varying float vAngleOfIncidence;'
);

containerWireframe.updateVertexShader(
    '#include <fog_vertex>',
    [
        'vec3 sourceNormal = color;',
        'vec3 modelPosition = (modelMatrix * vec4(position, 1)).xyz;',
        'vec3 cameraRay = normalize(cameraPosition - modelPosition);',
        'vec3 modelNormal = normalize((modelMatrix * vec4(sourceNormal, 1)).xyz);',
        'vAngleOfIncidence = dot(cameraRay, modelNormal);'
    ].join('\n')
);

containerWireframe.updateFragmentShader(
    '#include <common>',
    [
        'varying float vAngleOfIncidence;',
        'uniform vec3 frontColor;',
        'uniform vec3 backColor;'
    ].join('\n')
);

containerWireframe.updateFragmentShader(
    '#include <fog_fragment>',
    [
        'vec3 color = mix(frontColor, backColor, smoothstep(.0, -.5, vAngleOfIncidence));',
        'gl_FragColor = vec4(color, 1);'
    ].join('\n'),
    true
);

module.exports.containerWireframe = containerWireframe;


module.exports.containerBack = new THREE.MeshBasicMaterial({
    color: 0x1c1833,
    side: THREE.BackSide,
    transparent: true,
    opacity: .75
});


/* Crystals
   ========================================================================== */

var crystal = new ShadablePhongMaterial();

crystal.uniforms.seed = {type: 'f'};
crystal.uniforms.bottomClip = {type: 'f'};
crystal.uniforms.height = {type: 'f'};
crystal.uniforms.scale = {type: 'f'};

crystal.updateVertexShader(
    '#include <common>',
    [
        'varying vec3 vPosition;',
        'varying vec3 vReflect;'
    ].join('\n'),
    true
);

crystal.updateVertexShader(
    '#include <fog_vertex>',
    [
        'vPosition = position;',
        'vReflect = reflect(vec3(0,0,-1), transformedNormal);'
    ].join('\n')
);

crystal.updateFragmentShader(
    '#include <common>',
    [
        'varying vec3 vPosition;',
        'varying vec3 vReflect;',
        'uniform float seed;',
        'uniform float bottomClip;',
        'uniform float height;',
        'uniform float scale;',
        glslify('./shaders/lib/crystal-map.glsl')
    ].join('\n')
);

crystal.updateFragmentShader(
    '#include <logdepthbuf_fragment>',
    [
        'if (vPosition.z < bottomClip) { discard; }',
        'vec3 positon = vPosition;',
        'positon *= scale;',
        'positon.z += height * .5;',
        'float cTime = time * 2.5;',
        'vec4 m = map(seed, cTime, positon);',
        'float angleOfIncidence = acos(dot(normalize(vNormal + m.xyz * .2), normalize(vViewPosition)));',
        // 'angleOfIncidence = 1.75 - angleOfIncidence * .5;',
        // 'angleOfIncidence += e * .2;',
        // 'angleOfIncidence = pow(angleOfIncidence, 2.);',
        'vec3 col = spectrum(angleOfIncidence);',
        'float pat = pattern(seed, cTime * .5, positon + vec3(0,0,cTime * .01));',
        'float ee = pat * .2 + .8;',
        'col = spectrum(angleOfIncidence * ee);',

        'float sp = 0.;',
        'sp += clamp(dot(normalize(vec3(-1,0,0)), vReflect), 0., 1.);',
        'sp += clamp(dot(normalize(vec3(0,1,0)), vReflect), 0., 1.);',
        'sp += clamp(dot(normalize(vec3(-1,-.5,0)), vReflect), 0., 1.);',
        'sp /= 3.;',
        'sp = pow(sp, 3.);',
        'sp = clamp(sp, 0., 1.);',
        // 'col = mix(col, vec3(1), sp * .5);',
        'sp = pow(sp * 3., 10.);',
        'sp = clamp(sp, 0., 1.);',
        'col = mix(col, vec3(1), sp * (.5 + (1. - pat) * .5) * .5);',

        'col = linearToScreen(col);',
        'diffuseColor.rgb = col;',
        'gl_FragColor = diffuseColor;',
        'return;'
    ].join('\n'),
    true
);

module.exports.crystal = crystal;


/* Soil Cursor
   ========================================================================== */

module.exports.soilCursor = new THREE.ShaderMaterial({
    uniforms: {
        t1: {value: 0},
        t2: {value: 0}
    },
    vertexShader: glslify('./shaders/cursor.vert'),
    fragmentShader: glslify('./shaders/cursor.frag'),
    side: THREE.DoubleSide
});


/* Soil Bottom
   ========================================================================== */

const soilBottom = new ShadablePhongMaterial({
    color: white,
    shininess: 0
});

module.exports.soilBottom = soilBottom;


/* Soil top
   ========================================================================== */

const soilTop = new ShadablePhongMaterial();

soilTop.updateVertexShader(
    '#include <common>',
    'varying vec3 vPosition;'
);

soilTop.updateVertexShader(
    '#include <uv_vertex>',
    'vPosition = position;'
);

soilTop.updateFragmentShader(
    '#include <common>',
    [
        'varying vec3 vPosition;',
        'uniform float highlightTime;',
        'uniform vec3 highlightColor3;'
    ].join('\n')
);

soilTop.updateFragmentShader(
    '#include <color_fragment>',
    [
        'float magnitude = length(vPosition.xz);',
        'vec4 highlightColor = vec4(highlightColor3,1);',
        'float highlightAnim = magnitude * 35. + highlightTime * -40.;',
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
        'float highlightStep = 1. - highlightSize;',
        'diffuseColor = mix(diffuseColor, highlightColor, step(highlight, highlightStep) * (1. - highlightFade) * highlightGap);',
    ].join('\n')
);

const highlightColor = new THREE.Color(0xFC38A3);

soilTop.uniforms.highlightTime = {type: 'f', value: 0};
soilTop.uniforms.highlightColor3 = {type: 'v3', value: highlightColor.toArray()};

module.exports.soilTop = soilTop;


/* Planets
   ========================================================================== */

const planetColor = new THREE.Color(0x5cbcff);
const planetBgColor = new THREE.Color(0x43367A);

const planetSolid = new ShadablePhongMaterial({
    color: white,
    shininess: 0
});

planetSolid.updateVertexShader('#include <common>', instancedHead);
planetSolid.updateVertexShader('#include <begin_vertex>', instancedBody);

planetSolid.uniforms.colorA = {type: 'v3', value: planetBgColor};

planetSolid.updateFragmentShader(
    '#include <common>',
    [
        'varying float vVariant;',
        'uniform vec3 colorA;'
    ].join('\n')
);

planetSolid.updateFragmentShader(
    '#include <color_fragment>',
    [
        'diffuseColor.xyz = mix(diffuseColor.xyz, colorA, vVariant);',
    ].join('\n')
);

module.exports.planetSolid = planetSolid;


const planetBackground = new ShadablePhongMaterial({
    color: planetBgColor,
    shininess: 0
});

planetBackground.updateVertexShader('#include <common>', instancedHead);
planetBackground.updateVertexShader('#include <begin_vertex>', instancedBody);

module.exports.planetBackground = planetBackground;


const planetWireframe = new ShadableMeshBasicMaterial({
    color: planetColor,
    opacity: .5,
    transparent: true
});

planetWireframe.updateVertexShader('#include <common>', instancedHead);
planetWireframe.updateVertexShader('#include <begin_vertex>', instancedBody);

module.exports.planetWireframe = planetWireframe;


/* Stars
   ========================================================================== */

const stars = new ShadablePointsMaterial({
    transparent: true,
    depthWrite: false,
});

stars.extensions = {derivatives: true};

stars.updateVertexShader(
    '#include <common>',
    [
        'attribute float aSize;',
        'attribute float aSeed;',
        'uniform vec2 uResolution;',
        'varying float vSeed;',
    ].join('\n')
);

stars.updateVertexShader(
    '#include <color_vertex>',
    [
        'float sizeRez = min(uResolution.x, uResolution.y);',
        'vSeed = aSeed;'
    ].join('\n')
);

stars.vertexShader = stars.vertexShader.replace(/gl_PointSize = size/g, 'gl_PointSize = (aSize * sizeRez)');

stars.vertexShader = stars.vertexShader.replace('* ( scale / - mvPosition.z )', '/ length(cameraPosition - mvPosition.xyz)');

stars.updateFragmentShader(
    '#include <common>',
    [
        glslify('./shaders/lib/spectrum.glsl'),
        glslify('./shaders/lib/gamma.glsl'),
        glslify('./shaders/lib/hash11.glsl'),
        'varying float vSeed;',
        'uniform float time;'
    ].join('\n')
);

stars.updateFragmentShader(
    '#include <color_fragment>',
    [
        'vec2 cxy = 2.0 * gl_PointCoord - 1.0;',
        'float r = dot(cxy, cxy);',
        'float delta = fwidth(r);',
        'diffuseColor.a = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);',
        'diffuseColor.xyz = spectrum(vSeed * 6. + time * .2 * ceil(vSeed * 6.));',
        'diffuseColor.xyz = mix(diffuseColor.xyz, vec3(1), hash11(vSeed));'
    ].join('\n')
);

stars.uniforms.uResolution = {type: 'v2'};
stars.uniforms.time = {type: 'float', value: 0};

module.exports.stars = stars;


/* Background
   ========================================================================== */

const background = new ShadablePhongMaterial({
    color: 0x000000,
    side: THREE.BackSide,
    transparent: true
});

background.updateVertexShader(
    '#include <common>',
    [
        'varying vec3 vCameraPosition;',
        'varying vec3 vPosition;',
        'varying float hyperPowerRadial;',
        'varying vec2 cartCoords;',
        glslify('./shaders/lib/background-vert.glsl')
    ].join('\n')
);

background.updateVertexShader(
    '#include <fog_vertex>',
    [
        'vCameraPosition = cameraPosition;',
        'vPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;',
        'hyperPowerRadial = calcHyperPowerRadial();',
        'cartCoords = coords(vPosition, vCameraPosition);'
    ].join('\n')
);

background.updateFragmentShader(
    '#include <common>',
    [
        'varying vec3 vCameraPosition;',
        'varying vec3 vPosition;',
        'varying float hyperPowerRadial;',
        'varying vec2 cartCoords;',
        glslify('./shaders/lib/background.glsl')
    ].join('\n')
);

background.updateFragmentShader(
    '#include <color_fragment>',
    [
        'vec2 c = cartCoords;',
        'vec2 polarCoords = vec2(sqrt(c.x * c.x + c.y * c.y), atan(c.y, c.x));',
        'vec4 pattern = bgPattern(polarCoords);',
        'diffuseColor = pattern;',
    ].join('\n')
);

module.exports.background = background;


/* ShadableMixin
   ========================================================================== */

function ShadableMixin(SourceMaterial) {

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

    var NewMaterial = function(parameters) {
        SourceMaterial.call(this, parameters);

        const sourceType = this.type;
        this.type = 'ShaderMaterial';

        const shaderId = shaderIDs[sourceType];
        const shader = THREE.ShaderLib[shaderId];
        this.vertexShader = shader.vertexShader;
        this.fragmentShader = shader.fragmentShader;
        this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    };

    NewMaterial.prototype = Object.create(SourceMaterial.prototype);
    NewMaterial.prototype.constructor = NewMaterial;

    NewMaterial.prototype.enableHyper = function(hyperMap, headOnly) {
        this.updateVertexShader('#include <common>', hyperVertHead);
        this.updateVertexShader('#include <fog_vertex>', hyperVertBody);
        this.updateFragmentShader('#include <common>', hyperFragHead);
        this.uniforms.hyperMap = {type: 'v4', value: hyperMap};
        this.uniforms.uResolution = {type: 'v2', value: [0, 0]};
        this.uniforms.time = {type: 'f', value: 0};
        if ( ! headOnly) {
            this.updateVertexShader('#include <skinning_vertex>', hyperVertDeform);
            this.updateFragmentShader('#include <fog_fragment>', hyperFragBody);            
        }
    };

    NewMaterial.prototype.updateVertexShader = function(place, insert, before) {
        this.vertexShader = this.insertGlsl(this.vertexShader, place, insert, before);
    };

    NewMaterial.prototype.updateFragmentShader = function(place, insert, before) {
        this.fragmentShader = this.insertGlsl(this.fragmentShader, place, insert, before);
    };

    NewMaterial.prototype.insertGlsl = function(glsl, place, insert, before) {
        if (before) {
            return glsl.replace(place, insert + '\n' + place);
        }
        var a = glsl.replace(place, place + '\n' + insert);
        return a;
    };

    NewMaterial.prototype.copy = function(source) {
        SourceMaterial.prototype.copy.call(this, source);

        this.fragmentShader = source.fragmentShader;
        this.vertexShader = source.vertexShader;

        this.uniforms = THREE.UniformsUtils.clone(source.uniforms);

        if (this.uniforms.hyperMap) {
            this.uniforms.hyperMap = source.uniforms.hyperMap;
        }
        if (this.uniforms.uResolution) {
            this.uniforms.uResolution = source.uniforms.uResolution;
        }
        if (this.uniforms.time) {
            this.uniforms.time = source.uniforms.time;
        }

        return this;
    };

    return NewMaterial;
}
