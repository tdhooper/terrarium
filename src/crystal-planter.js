var materials = require('./materials');
const Crystal = require('./crystal');


const CrystalPlanter = function(parent, app) {
    this.app = app;
    this.crystals = [];

    this.object = new THREE.Group();
    parent.add(this.object);

    this.material = materials.crystal;
    this.material.uniforms.seed.value = Math.random();
    this.material.uniforms.height.value = 1;
    this.material.uniforms.scale.value = 1;

    // const sphereGeom = new THREE.SphereGeometry(.5);
    // const sphere = new THREE.Mesh(sphereGeom, this.material);
    // this.object.add(sphere);

    // var boxGeom = new THREE.BoxGeometry(.2, 1, .2);
    // var box = new THREE.Mesh(boxGeom, this.material);
    // box.position.x = .5;
    // this.object.add(box);

    // box.onBeforeRender = function() {
    //     this.material.uniforms.time.value = this.app.elapsed / 500;
    // }.bind(this);

    // var m = new THREE.MeshPhongMaterial({
    //     color: 0x666666,
    //     shininess: 100000,
    //     specular: 0xffffff
    // });
    // var boxGeom = new THREE.BoxGeometry(.2, 1, .2);
    // var box = new THREE.Mesh(boxGeom, m);
    // box.position.x = -.5;
    // this.object.add(box);

    app.eventMediator.on('soil-cursor.down', this.onMouseDown.bind(this));
    app.eventMediator.on('soil-cursor.up', this.onMouseUp.bind(this));
};

CrystalPlanter.prototype.onMouseDown = function(intersection) {
    const position = intersection.point.clone();
    this.object.worldToLocal(position);
    const normal = intersection.normal.clone();
    const crystal = new Crystal(
        this.object,
        this.app,
        position,
        normal,
        this.material
    );
    this.crystals.push(crystal);
    this.activeCrystal = crystal;
    this.adjustNormals();
};

CrystalPlanter.prototype.onMouseUp = function() {
    if (this.activeCrystal) {
        this.activeCrystal.stopGrowth();
        this.app.history.add({
            destroy: this.destroy.bind(this, this.activeCrystal),
            restore: this.restore.bind(this, this.activeCrystal)
        });
    }
};

CrystalPlanter.prototype.destroy = function(crystal) {
    crystal.destroy();
    this.crystals = this.crystals.filter(c => c !== crystal);
    this.clearIdealNormalsCache(crystal);
    this.adjustNormals();
};

CrystalPlanter.prototype.restore = function(crystal) {
    crystal.restore();
    this.crystals.push(crystal);
    this.activeCrystal = crystal;
    this.adjustNormals();
};

CrystalPlanter.prototype.clearIdealNormalsCache = function(crystalA) {
    this.crystals.forEach((crystalB) => {
        if (crystalB.idealNormals.hasOwnProperty(crystalA.id)) {
            delete crystalB.idealNormals[crystalA.id];
        }
    });
};

CrystalPlanter.prototype.adjustNormals = function() {
    const separation = .3;

    this.crystals.forEach((crystalA) => {
        this.crystals.forEach((crystalB) => {
            if (crystalA === crystalB) {
                return;
            }
            if (crystalA.idealNormals.hasOwnProperty(crystalB.id)) {
                return;
            }
            const midNormal = crystalA.normal.clone().add(crystalB.normal).normalize();
            const adjacent = crystalA.position.clone().sub(crystalB.position).normalize();
            const tangent = midNormal.clone().cross(adjacent);
            const idealA = midNormal.clone().applyAxisAngle(tangent, separation);
            const idealB = midNormal.clone().applyAxisAngle(tangent, -separation);
            const distance = crystalA.position.distanceTo(crystalB.position);
            crystalA.idealNormals[crystalB.id] = [idealA, distance];
            crystalB.idealNormals[crystalA.id] = [idealB, distance];
        });
    });

    this.crystals.forEach((crystal) => {
        const normal = crystal.normal.clone();
        for (const [key, ideal] of Object.entries(crystal.idealNormals)) {
            var scale = Math.max(1 - ideal[1], 0);
            if ( ! scale) {
                continue;
            }
            scale = Math.pow(scale, 2);
            const idealNormal = ideal[0].clone();
            idealNormal.multiplyScalar(scale);
            normal.add(idealNormal);
        }
        normal.normalize();

        const distance = crystal.position.distanceTo(this.activeCrystal.position);
        var delay = distance * 500;
        delay += Math.random() * 500;
        crystal.setDirection(normal, true, delay);
    });
};

CrystalPlanter.prototype.setVisible = function(value) {
    this.object.visible = value;
};

module.exports = CrystalPlanter;
