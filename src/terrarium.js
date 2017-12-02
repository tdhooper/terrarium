const ContainerGeometry = require('./container-geometry');
const Container = require('./container');
const ContainerBackground = require('./container-background');
const Soil = require('./soil');
const SoilCursor = require('./soil-cursor');
const CrystalPlanter = require('./crystal-planter');
const materials = require('./materials');

const Terrarium = function(parent, app) {
    const group = new THREE.Group();
    parent.add(group);
    this.group = group;

    const containerGeom = new ContainerGeometry();
    const containerBackground = new ContainerBackground(group, app, containerGeom);
    const container = new Container(group, app, containerGeom);
    const soil = new Soil(group, containerGeom, app);
    const soilCursor = new SoilCursor(parent, app);
    const crystalPlanter = new CrystalPlanter(group, app);

    this.container = container;
    this.containerBackground = containerBackground;
    this.soil = soil;
    this.soilCursor = soilCursor;
    this.crystalPlanter = crystalPlanter;

    // Animations

    const TWEEN = app.TWEEN;

    // group.scale.set(.001,.001,.001);
    // const inTween = new TWEEN.Tween(group.scale)
    //     .to({x: 1, y: 1, z: 1}, 1250)
    //     .easing(TWEEN.Easing.Cubic.Out)
    //     .onComplete(() => {
    //         app.eventMediator.emit('ready');
    //     });

    app.eventMediator.emit('ready');

    // this.rotateLock = true;
    // group.rotation.y = -Math.PI;
    const spinTween = new TWEEN.Tween(group.rotation)
        .to({y: Math.PI * 2}, 7000)
        .repeat(Infinity);

    spinTween.start();
    // app.eventMediator.on('start', function() {
    //     inTween.start();
    //     spinTween.start();
    // });
};

Terrarium.prototype.setRotation = function(rotation) {
    if (this.rotateLock) {
        return;
    }
    this.group.rotation.y = rotation % (Math.PI * 2);
};

module.exports = Terrarium;
