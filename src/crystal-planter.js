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
        this.app.history.add(this.activeCrystal);
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

module.exports = CrystalPlanter;
