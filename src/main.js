const EventEmitter = require('events');

const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const PerspectiveCamera = require('./lib/square-perspective-camera');

var TWEEN = require('@tweenjs/tween.js');

const InteractionPublisher = require('./interaction-publisher');
const Terrarium = require('./terrarium');
const InlineLog = require('./inline-log');


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
    this.app = {
        TWEEN: TWEEN,
        eventMediator: eventMediator,
        interactionPublisher: interactionPublisher,
        camera: this.camera,
        log: log
    };
};

Main.prototype.initScene = function() {
    const terrarium = new Terrarium(this.scene, this.app);
    this.app.eventMediator.emit('start');
};

Main.prototype.initThree = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2.5, 1.5, 0);
    this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.25;
    this.cameraControls.rotateSpeed = 0.25;

    this.scene = new THREE.Scene();
};

Main.prototype.render = function() {
    this.cameraControls.update();
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
