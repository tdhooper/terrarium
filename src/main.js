const EventEmitter = require('events');

const THREE = require('./lib/three');
const OrbitControls = require('three-orbit-controls')(THREE);
const PerspectiveCamera = require('./lib/square-perspective-camera');
const TWEEN = require('@tweenjs/tween.js');
const Stats = require('stats.js');

const InteractionPublisher = require('./interaction-publisher');
const History = require('./history');
const Terrarium = require('./terrarium');
const Lights = require('./lights');
const InlineLog = require('./inline-log');
const Controls = require('./controls');
const QualityAdjust = require('./quality-adjust');
const RenderPass = require('./render-pass');


THREE.DotScreenShader = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "tSize":    { type: "v2", value: new THREE.Vector2( 256, 256 ) },
    "center":   { type: "v2", value: new THREE.Vector2( 0.5, 0.5 ) },
    "angle":    { type: "f", value: 1.57 },
    "scale":    { type: "f", value: 1.0 }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform vec2 center;",
    "uniform float angle;",
    "uniform float scale;",
    "uniform vec2 tSize;",
    "uniform sampler2D tDiffuse;",
    "varying vec2 vUv;",
    "float pattern() {",
      "float s = sin( angle ), c = cos( angle );",
      "vec2 tex = vUv * tSize - center;",
      "vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;",
      "return ( sin( point.x ) * sin( point.y ) ) * 4.0;",
    "}",
    "void main() {",
      "vec4 color = texture2D( tDiffuse, vUv );",
      "float average = ( color.r + color.g + color.b ) / 3.0;",
      "gl_FragColor = color;",
      // "gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );",
    "}"
  ].join("\n")
};

const Main = function() {
    // this.log = new InlineLog();
    this.log = console;

    this.initThree();
    this.initApp();
    this.initScene();
    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();
    this.animate();
};

Main.prototype.initApp = function() {
    class Emitter extends EventEmitter {}
    const eventMediator = new Emitter();
    const interactionPublisher = new InteractionPublisher(
        this.renderer.domElement,
        this.camera,
        eventMediator,
        this.log
    );
    const history = new History(eventMediator);
    this.app = {
        TWEEN: TWEEN,
        eventMediator: eventMediator,
        interactionPublisher: interactionPublisher,
        camera: this.camera,
        history: history,
        log: this.log,
        scene: this.scene
    };
    const controls = new Controls(document.body, this.app);

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.left = 'auto';
    this.stats.dom.style.right = 0;
};

Main.prototype.initScene = function() {
    this.lights = new Lights(this.scene);
    this.terrarium = new Terrarium(this.scene, this.app);
    // this.scene.fog = new THREE.FogExp2(0xe0ecff, .2);
    this.adjust = new QualityAdjust(this);
    this.app.eventMediator.emit('start');
};

Main.prototype.initThree = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0xe0ecff, 1);
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container = document.createElement('div');
    this.container.classList.add('container');
    document.body.appendChild(this.container);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2.5, 1.5, 0);
    this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.05;
    this.cameraControls.rotateSpeed = 0.066;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // postprocessing
    this.composer = new THREE.EffectComposer(this.renderer);

    var pass = new RenderPass(this.scene, this.camera, this.renderFunc.bind(this));
    this.composer.addPass(pass);

    var rgbEffect = new THREE.ShaderPass(THREE.CopyShader);
    rgbEffect.clear = true;
    rgbEffect.renderToScreen = true;
    this.composer.addPass(rgbEffect);
};

Main.prototype.render = function() {
    this.cameraControls.update();
    var rotation = new THREE.Euler(0, this.cameraControls.getAzimuthalAngle(), 0);
    this.lights.setRotation(rotation);
    this.composer.render(.1);
};

Main.prototype.renderFunc = function(renderer, render) {

    renderer.autoClear = true;

    if (this.terrarium.soilCursor.renderOnTop) {
        render();
        return;
    }

    // Render scene without cursor
    this.terrarium.soilCursor.setVisible(false);
    render();

    renderer.autoClear = false;

    // Render crystals and container to depth buffer only
    this.renderer.clearDepth();
    this.terrarium.soil.setVisible(false);
    this.terrarium.soilCursor.setVisible(false);
    this.renderer.context.colorMask( false, false, false, false );
    render();
    this.renderer.context.colorMask( true, true, true, true );

    // Render cursor only
    this.terrarium.container.setVisible(false);
    this.terrarium.crystalPlanter.setVisible(false);
    this.terrarium.soilCursor.setVisible(true);
    render();

    this.terrarium.container.setVisible(true);
    this.terrarium.soil.setVisible(true);
    this.terrarium.crystalPlanter.setVisible(true);

};

Main.prototype.animate = function() {
    // setTimeout(this.animate.bind(this), Math.random() * 70);
    requestAnimationFrame(this.animate.bind(this));
    this.stats.begin();
    this.app.eventMediator.emit('update');
    TWEEN.update();
    this.render();
    this.stats.end();
    this.adjust.update();
};

Main.prototype.onResize = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.renderTarget1.setSize(width * this.renderer.getPixelRatio(), height * this.renderer.getPixelRatio());
    this.composer.renderTarget2.setSize(width * this.renderer.getPixelRatio(), height * this.renderer.getPixelRatio());

    // Fixes https://github.com/mrdoob/three.js/issues/9500
    // From https://bugs.webkit.org/show_bug.cgi?id=152556#c2
    this.container.style.height = (height + 1) + 'px';
    requestAnimationFrame(() => {
        this.container.style.width = width + 'px';
        this.container.style.height = height + 'px';
    });
};

Main.prototype.setPixelRatio = function(value) {
    if (this.renderer.getPixelRatio() === value) {
        return;
    }
    this.renderer.setPixelRatio(value);
    this.onResize();
    this.render();
};

module.exports = Main;
