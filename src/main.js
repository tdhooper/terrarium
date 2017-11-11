global.THREE = require('three');
require('three/examples/js/controls/OrbitControls');

const EventEmitter = require('events');

const PerspectiveCamera = require('./lib/square-perspective-camera');
const TWEEN = require('@tweenjs/tween.js');
const Stats = require('stats.js');

const materials = require('./materials');
const InteractionPublisher = require('./interaction-publisher');
const History = require('./history');
const Terrarium = require('./terrarium');
const Space = require('./space');
const Lights = require('./lights');
const InlineLog = require('./inline-log');
const Controls = require('./controls');
const QualityAdjust = require('./quality-adjust');
const Controller = require('./controller');


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
    this.space = new Space(this.scene, this.app);
    this.adjust = new QualityAdjust(this);
    this.app.terrarium = this.terrarium;
    const controller = new Controller(this.app);
    this.app.eventMediator.emit('start');
};

Main.prototype.initThree = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.autoClearColor = false;
    this.renderer.autoClearDepth = false;
    this.renderer.autoClearStencil = false;
    this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container = document.createElement('div');
    this.container.classList.add('container');
    document.body.appendChild(this.container);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3 * 1.2, .5 * 1.2, 0);
    this.camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI * .12);
    this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.05;
    this.cameraControls.rotateSpeed = 0.066;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
};

Main.prototype.render = function() {
    this.cameraControls.update();
    var rotation = new THREE.Euler(0, this.cameraControls.getAzimuthalAngle(), 0);
    this.lights.setRotation(rotation);

    this.renderer.clear(true, true, true);

    if (this.terrarium.soilCursor.renderOnTop) {

        // Render background and space only
        this.terrarium.soilCursor.setVisible(false);
        this.terrarium.container.setVisible(false);
        this.terrarium.soil.setVisible(false);
        this.terrarium.soilCursor.setVisible(false);
        this.renderer.render(this.scene, this.camera);

        // render everything else
        this.space.setVisible(false);
        this.terrarium.containerBackground.setVisible(false);
        this.terrarium.soilCursor.setVisible(true);
        this.terrarium.container.setVisible(true);
        this.terrarium.soil.setVisible(true);
        this.terrarium.soilCursor.setVisible(true);
        this.renderer.render(this.scene, this.camera);

        this.space.setVisible(true);
        this.terrarium.containerBackground.setVisible(true);
        return;
    }

    // Render scene without cursor
    this.terrarium.soilCursor.setVisible(false);
    this.renderer.render(this.scene, this.camera);

    // Render crystals and container to depth buffer only
    this.renderer.clearDepth();
    this.space.setVisible(false);
    this.terrarium.containerBackground.setVisible(false);
    this.terrarium.soil.setVisible(false);
    this.terrarium.soilCursor.setVisible(false);
    this.renderer.context.colorMask( false, false, false, false );
    this.renderer.render(this.scene, this.camera);
    this.renderer.context.colorMask( true, true, true, true );

    // Render cursor only
    this.terrarium.container.setVisible(false);
    this.terrarium.crystalPlanter.setVisible(false);
    this.terrarium.soilCursor.setVisible(true);
    this.renderer.render(this.scene, this.camera);

    this.space.setVisible(true);
    this.terrarium.container.setVisible(true);
    this.terrarium.containerBackground.setVisible(true);
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

    var size = this.renderer.getDrawingBufferSize();
    materials.stars.uniforms.uResolution.value = [
        size.width,
        size.height
    ];

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
