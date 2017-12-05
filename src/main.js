global.THREE = require('three/build/three');

require('three/examples/js/controls/OrbitControls');

const EventEmitter = require('events');

const PerspectiveCamera = require('./lib/square-perspective-camera');
const TWEEN = require('@tweenjs/tween.js');
// const Stats = require('stats.js');
var FileSaver = require('file-saver');
var pad = require('pad-number');

const ActivityMonitor = require('./activity');
const materials = require('./materials');
const InteractionPublisher = require('./interaction-publisher');
const History = require('./history');
const Terrarium = require('./terrarium');
const Space = require('./space');
const Lights = require('./lights');
// const InlineLog = require('./inline-log');
const Controls = require('./controls');
const QualityAdjust = require('./quality-adjust');
const Controller = require('./controller');
// const Autorotate = require('./autorotate');
const HyperMap = require('./hyper-map');
const Audio = require('./audio');


const Main = function() {
    // this.log = new InlineLog();
    this.log = console;
    this.seconds = 0;

    new ActivityMonitor();

    class Emitter extends EventEmitter {}
    this.eventMediator = new Emitter();

    this.initThree();
    this.initApp();
    this.initScene();

    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();
    // setTimeout(() => {
        this.startTime = 0;
        // requestAnimationFrame(this.animate.bind(this));
        // setTimeout(() => {
            // setTimeout(() => {
                // this.adjust.enable();
    //         // }, 1000);
    //     }, 100);
    // }, 100);

    var crystalSpecs = [
        [[0,0], 1],
        [[.2,0], .6],
        [[.05,.16], .7],
        [[-.05,.2], .55],
        [[-.16,.05], .8],
        [[-.35,-.15], .4],
        [[-.2,-.125], .65],
        [[-.15,-.2], .5],
        [[0,-.18], .7],

        [[.4,.4], .5],
        [[.45,.3], .35],

        [[.0,-.6], .45],
        [[.12,-.58], .3],
        [[.05,-.5], .5],
    ];

    this.eventMediator.on('start', () => {
        var rayCaster = new THREE.Raycaster();
        crystalSpecs.forEach(spec => {
            var xy = spec[0];
            var size = spec[1];
            rayCaster.set(new THREE.Vector3(xy[0],1,xy[1]), new THREE.Vector3(0,-1,0));
            var intersect = rayCaster.intersectObject(this.terrarium.soil.top)[0];
            intersect.normal = this.terrarium.soilCursor.normalIntersection(intersect);
            this.terrarium.crystalPlanter.onMouseDown(intersect);
            this.terrarium.crystalPlanter.activeCrystal.setSize(size);
        });
    });

    this.eventMediator.emit('start');


    window.save = this.save.bind(this);
    window.setTime = this.setTime.bind(this);

    this.animate();
};

Main.prototype.initApp = function() {
    const interactionPublisher = new InteractionPublisher(
        this.renderer.domElement,
        this.camera,
        this.eventMediator,
        this.log
    );
    const history = new History(this.eventMediator);
    const hyperMap = new HyperMap(this.eventMediator);
    new Audio(this.eventMediator);

    materials.addHyperMap(hyperMap);
    this.app = {
        TWEEN: TWEEN,
        eventMediator: this.eventMediator,
        interactionPublisher: interactionPublisher,
        camera: this.camera,
        history: history,
        log: this.log,
        scene: this.scene,
        elapsed: 0,
        delta: 0,
        hyperMap: hyperMap
    };
    const controls = new Controls(document.body, this.app);

    // this.stats = new Stats();
    // document.body.appendChild(this.stats.dom);
    // this.stats.dom.style.left = 'auto';
    // this.stats.dom.style.right = 0;
};

Main.prototype.initScene = function() {
    this.lights = new Lights(this.scene);
    this.terrarium = new Terrarium(this.scene, this.app);
    this.space = new Space(this.scene, this.app);
    this.app.space = this.space;
    this.adjust = new QualityAdjust(this);
    this.app.terrarium = this.terrarium;
    const controller = new Controller(this.app);
    // this.autorotate = new Autorotate(this.app, this.terrarium);

    var mat = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors
    });
    var planeGeom = new THREE.PlaneGeometry(500, 500);
    var colA = new THREE.Color(0x4e5fa1);
    var colB = new THREE.Color(0x5d3277);
    planeGeom.faces[0].vertexColors = [colA, colB, colA];
    planeGeom.faces[1].vertexColors = [colB, colB, colA];
    var plane = new THREE.Mesh(planeGeom, mat);
    plane.lookAt(this.camera.position);
    plane.translateZ(-500);
    this.scene.add(plane);
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
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container = document.createElement('div');
    this.container.classList.add('container');
    document.body.insertBefore(this.container, document.body.firstChild);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3 * 1.2, .8 * 1.2, 0);

    this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.cameraControls.enableDamping = true;
    this.cameraControls.dampingFactor = 0.05;
    this.cameraControls.rotateSpeed = 0.066;
    this.cameraControls.maxDistance = 20;
    this.cameraControls.minDistance = .75;

    var azimuth = 0;
    this.cameraControls.addEventListener('change', () => {
        var newAzimuth = this.cameraControls.getAzimuthalAngle();
        if (newAzimuth !== azimuth) {
            this.eventMediator.emit('camera.rotate.azimuth', newAzimuth);
        }
        azimuth = newAzimuth;
    });

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
};

Main.prototype.render = function() {
    this.cameraControls.update();
    var rotation = new THREE.Euler(0, this.cameraControls.getAzimuthalAngle(), 0);
    this.lights.setRotation(rotation);

    if (this.afterFirstPaint) {
        this.renderer.clear();
    } else {
        this.fadeIn();
    }

    this.afterFirstPaint = true;

    this.renderer.render(this.scene, this.camera);
    return;

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
    // this.setTime(this.seconds + 1/60);
    var now = this.seconds * 1000;
    if (this.startTime !== undefined) {
        this.app.elapsed = (now - this.startTime) / 1000;
        materials.setTime(this.app.elapsed);
    }
    this.lastNow = this.lastNow || now;
    this.app.delta = (now - this.lastNow) / 1000;
    this.lastNow = now;

    // console.log(this.app.elapsed)

    var loop = (this.app.elapsed / 2.5) % 1;
    // console.log(this.app.elapsed, loop);
    if (loop > .1 && loop < .2) {
        this.app.hyperMap.addWave();
    }
    // if (loop > .95) {
    //     return;
    // }

    // setTimeout(this.animate.bind(this), Math.random() * 70);
    // requestAnimationFrame(this.animate.bind(this));
    // this.stats.begin();
    this.eventMediator.emit('update', this.app.delta, this.app.elapsed);
    TWEEN.update(now);
    this.render();
    // this.stats.end();
    this.adjust.update();
};

Main.prototype.setSize = function(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    var size = this.renderer.getDrawingBufferSize();
    materials.setResolution(size.width, size.height);

    // Fixes https://github.com/mrdoob/three.js/issues/9500
    // From https://bugs.webkit.org/show_bug.cgi?id=152556#c2
    // this.container.style.height = (height + 1) + 'px';
    // requestAnimationFrame(() => {
        this.container.style.width = width + 'px';
        this.container.style.height = height + 'px';
    // });
};

Main.prototype.onResize = function() {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;
    this.setSize(width, height);
};

Main.prototype.setPixelRatio = function(value) {
    if (this.renderer.getPixelRatio() === value) {
        return;
    }
    this.renderer.setPixelRatio(value);
    this.onResize();
    this.render();
};

Main.prototype.fadeIn = function() {
    document.body.classList.remove('hide-canvas');
};

Main.prototype.setTime = function(seconds) {
    // console.log(seconds);
    this.seconds = seconds;
};

Main.prototype.save = function(prefix, width, height, fps, seconds) {

    width = width || 500;
    height = height || 500;

    var resolution = [width, height];

    var that = this;

    var totalFrames = fps * seconds;

    that.setSize(width, height);

    function saveFrame(frame) {
        that.setTime(frame / fps);
        that.animate();

        that.renderer.domElement.toBlob(function(blob) {
            var digits = totalFrames.toString().length;
            var filename = prefix + '-' + pad(frame, digits) + '.png';
            FileSaver.saveAs(blob, filename);
            if (frame < totalFrames - 1) {
                saveFrame(frame + 1);
            }
        });
    }

    saveFrame(0);
};

module.exports = Main;
