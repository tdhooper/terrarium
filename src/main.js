const EventEmitter = require('events');

const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const PerspectiveCamera = require('./lib/square-perspective-camera');
const TWEEN = require('@tweenjs/tween.js');
const Stats = require('stats.js');

const InteractionPublisher = require('./interaction-publisher');
const History = require('./history');
const Terrarium = require('./terrarium');
const InlineLog = require('./inline-log');
const Controls = require('./controls');
const QualityAdjust = require('./quality-adjust');


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
        log: log,
        main: this,
    };
    const controls = new Controls(document.body, this.app);

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.left = 'auto';
    this.stats.dom.style.right = 0;
};

Main.prototype.initScene = function() {

    var lights = new THREE.Group();

    var sunPosition = new THREE.Vector3(-1, 2, 0);

    var skyLight = new THREE.HemisphereLight(0xfafaff, 0xb0b0c0, 1);
    skyLight.position.set(-2, 0, 0);
    lights.add(skyLight);

    var light = new THREE.PointLight(0xffffc0, .1);
    light.position.copy(sunPosition);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    lights.add(light);
    this.shadowLightHigh = light;

    var lightLow = new THREE.PointLight(0xffffc0, .1);
    lightLow.position.copy(sunPosition);
    lightLow.castShadow = false;
    lights.add(lightLow);
    this.shadowLightLow = lightLow;

    this.lights = lights;

    this.scene.add(lights);
    this.terrarium = new Terrarium(this.scene, this.app);
    this.app.eventMediator.emit('start');
    this.adjust = new QualityAdjust(this.app);
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2.5, 1.5, 0);
    this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.05;
    this.cameraControls.rotateSpeed = 0.066;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
};

Main.prototype.render = function() {
    this.cameraControls.update();
    var rotation = new THREE.Euler(0, this.cameraControls.getAzimuthalAngle(), 0);
    this.lights.setRotationFromEuler(rotation);

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
    this.renderer.context.colorMask( true, true, true, true );

    // Render cursor only
    this.terrarium.container.setVisible(false);
    this.terrarium.crystalPlanter.setVisible(false);
    this.terrarium.soilCursor.setVisible(true);
    this.renderer.render(this.scene, this.camera);
};

Main.prototype.animate = function() {
    // setTimeout(this.animate.bind(this), Math.random() * 100);
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
};

module.exports = Main;
