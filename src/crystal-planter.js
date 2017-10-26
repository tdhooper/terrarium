const THREE = require('three');

const Crystal = require('./crystal');


const CrystalPlanter = function(parent, app) {
    this.parent = parent;
    this.app = app;
    this.crystals = [];

    app.eventMediator.on('soil-cursor.down', this.onMouseDown.bind(this));
    app.eventMediator.on('soil-cursor.up', this.onMouseUp.bind(this));
};

CrystalPlanter.prototype.onMouseDown = function(intersection) {
    const position = intersection.point.clone();
    this.parent.worldToLocal(position);
    const normal = intersection.normal.clone();
    const crystal = new Crystal(this.parent, this.app, position, normal);
    this.crystals.push(crystal);
    this.activeCrystal = crystal;
    this.adjustNormals();
};

CrystalPlanter.prototype.onMouseUp = function() {
    if (this.activeCrystal) {
        this.activeCrystal.stopGrowth();
    }
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
            var midNormal = crystalA.normal.clone().add(crystalB.normal).normalize();
            var adjacent = crystalA.position.clone().sub(crystalB.position).normalize();
            var tangent = midNormal.clone().cross(adjacent);
            var idealA = midNormal.clone().applyAxisAngle(tangent, separation);
            var idealB = midNormal.clone().applyAxisAngle(tangent, -separation);
            var distance = crystalA.position.distanceTo(crystalB.position);
            crystalA.idealNormals[crystalB.id] = [idealA, distance];
            crystalB.idealNormals[crystalA.id] = [idealB, distance];
        });
    });

    this.crystals.forEach((crystal) => {
        var normal = crystal.normal.clone();
        for (const [key, ideal] of Object.entries(crystal.idealNormals)) {
            var scale = Math.max(1 - ideal[1], 0);
            if ( ! scale) {
                continue;
            }
            scale = Math.pow(scale, 2);
            var idealNormal = ideal[0].clone();
            idealNormal.multiplyScalar(scale);
            normal.add(idealNormal);
        }
        normal.normalize();
        crystal.setDirection(normal);
    });
};

module.exports = CrystalPlanter;
