const EventEmitter = require('events');

const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const PerspectiveCamera = require('./lib/square-perspective-camera');

var TWEEN = require('@tweenjs/tween.js');

const InteractionPublisher = require('./interaction-publisher');
const History = require('./history');
const Terrarium = require('./terrarium');
const InlineLog = require('./inline-log');
const Controls = require('./controls');


const Main = function() {
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
    // const log = new InlineLog();
    const log = console;
    const interactionPublisher = new InteractionPublisher(
        this.renderer.domElement,
        this.camera,
        eventMediator,
        log
    );
    const history = new History(eventMediator);
    this.app = {
        TWEEN: TWEEN,
        eventMediator: eventMediator,
        interactionPublisher: interactionPublisher,
        camera: this.camera,
        history: history,
        log: log
    };
    const controls = new Controls(document.body, this.app);
};

Main.prototype.initScene = function() {
    this.terrarium = new Terrarium(this.scene, this.app);
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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.autoClearColor = false;
    this.renderer.autoClearDepth = false;
    this.renderer.autoClearStencil = false;
    document.body.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2.5, 1.5, 0);
    this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.05;
    this.cameraControls.rotateSpeed = 0.066;

    this.scene = new THREE.Scene();
};

Main.prototype.render = function() {
    this.cameraControls.update();
    this.renderer.clear(true, true, true);

    // Render scene without cursor
    this.terrarium.container.setVisible(true);
    this.terrarium.soil.setVisible(true);
    this.terrarium.soilCursor.setVisible(false);
    this.terrarium.crystalPlanter.setVisible(true);
    this.renderer.render(this.scene, this.camera);

    // Render crystals and container to depth buffer only
    this.renderer.clearDepth();
    this.terrarium.soil.setVisible(false);
    this.terrarium.soilCursor.setVisible(false);
    this.renderer.context.colorMask( false, false, false, false );
    this.renderer.render(this.scene, this.camera);

    // Render cursor only
    this.terrarium.container.setVisible(false);
    this.terrarium.crystalPlanter.setVisible(false);
    this.terrarium.soilCursor.setVisible(true);
    this.renderer.context.colorMask( true, true, true, true );
    this.renderer.render(this.scene, this.camera);
};

Main.prototype.animate = function() {
    requestAnimationFrame(this.animate.bind(this));
    this.app.eventMediator.emit('update');
    TWEEN.update();
    this.render();
};

Main.prototype.onResize = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
};

module.exports = Main;
