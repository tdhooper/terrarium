var Crystal = require('./crystal');


const CrystalPlanter = function(parent, app) {
    this.parent = parent;
    this.app = app;

    app.eventMediator.on('soil-cursor.down', this.onMouseDown.bind(this));
    app.eventMediator.on('soil-cursor.up', this.onMouseUp.bind(this));
};


CrystalPlanter.prototype.onMouseDown = function(intersection) {
    var position = intersection.point.clone();
    this.parent.worldToLocal(position);

    var normal = intersection.normal.clone();
    this.parent.worldToLocal(normal);
    var top = intersection.point.clone().add(normal);
    this.parent.worldToLocal(top);

    this.activeCrystal = new Crystal(this.parent, this.app, position, top);
};

CrystalPlanter.prototype.onMouseUp = function() {
    if (this.activeCrystal) {
        this.activeCrystal.stopGrowth();
    }
};


module.exports = CrystalPlanter;
