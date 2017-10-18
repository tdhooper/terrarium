const EventEmitter = require('events');

const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);

var TWEEN = require('@tweenjs/tween.js');

const Container = require('./container');
const SoilCursor = require('./soil-cursor');
const InteractionPublisher = require('./interaction-publisher');


const Terrarium = function() {
    this.initThree();
    this.initScene();
    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();
    this.animate();
};

Terrarium.prototype.initScene = function() {

    class Emitter extends EventEmitter {}
    const eventMediator = new Emitter();
    const interactionPublisher = new InteractionPublisher(this.camera, eventMediator);

    const app = {
        TWEEN: TWEEN,
        eventMediator: eventMediator,
        interactionPublisher: interactionPublisher
    };

    const container = new Container(this.scene, app);
    const soilCursor = new SoilCursor(this.scene, app);

    eventMediator.emit('start');
};

Terrarium.prototype.initThree = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3, 2, 0);
    this.cameraControls = new OrbitControls(this.camera);

    this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
};

Terrarium.prototype.render = function() {
    this.cameraControls.update();
    this.renderer.render(this.scene, this.camera);
};

Terrarium.prototype.animate = function() {
    requestAnimationFrame(this.animate.bind(this));
    TWEEN.update();
    this.render();
};

Terrarium.prototype.onResize = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
};

module.exports = Terrarium;
