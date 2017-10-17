var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);

var Container = require('./container');


var Terrarium = function() {
    this.initThree();
    this.initScene();
    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();
    this.animate();
};

Terrarium.prototype.initScene = function() {
    this.container = new Container(this.scene);
}

Terrarium.prototype.initThree = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.x = 5;
    this.cameraControls = new OrbitControls(this.camera);

    this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
}

Terrarium.prototype.render = function() {
    this.cameraControls.update();
    this.renderer.render(this.scene, this.camera);
}

Terrarium.prototype.animate = function() {
    this.render();
    requestAnimationFrame(this.animate.bind(this));
}

Terrarium.prototype.onResize = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
}

module.exports = Terrarium;
