const THREE = require('three');

const ContainerGeometry = require('./container-geometry');
const Container = require('./container');
const Soil = require('./soil');
const SoilCursor = require('./soil-cursor');
const CrystalPlanter = require('./crystal-planter');

const Terrarium = function(parent, app) {
    const group = new THREE.Group();
    parent.add(group);

    const containerGeom = new ContainerGeometry();
    const container = new Container(group, app, containerGeom);
    const soil = new Soil(group, containerGeom, app);
    const soilCursor = new SoilCursor(parent, app);
    const crystalPlanter = new CrystalPlanter(group, app);

    this.container = container;
    this.soil = soil;
    this.soilCursor = soilCursor;
    this.crystalPlanter = crystalPlanter;

    // Animations

    const TWEEN = app.TWEEN;

    group.scale.set(.001,.001,.001);
    const inTween = new TWEEN.Tween(group.scale)
        .to({x: 1, y: 1, z: 1}, 1250)
        .easing(TWEEN.Easing.Cubic.Out);

    group.rotation.y = 0;
    const spinTween = new TWEEN.Tween(group.rotation)
        .to({y: Math.PI}, 1500)
        .easing(TWEEN.Easing.Cubic.Out);

    app.eventMediator.on('start', function() {
        inTween.start();
        spinTween.start();
    });
};

module.exports = Terrarium;
