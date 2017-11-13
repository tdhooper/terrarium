const ThreeBSP = require('ThreeCSG')(THREE);
const genRandom = require('random-seed');


function topPlane(slope, angle, point) {
    var normal = new THREE.Vector3(
        0,
        Math.cos( (slope * .5 - .5) * Math.PI),
        Math.sin( (slope * .5 - .5) * Math.PI)
    );
    normal.applyAxisAngle(
        new THREE.Vector3(0, 0, 1),
        angle * Math.PI * 2
    );
    var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
    var basicPlane = [
        plane.normal.toArray(),
        plane.constant
    ];
    return basicPlane;
}

function create(spec) {
    var engine = threeEngine;
    var shape = polygon(spec.sides, spec.diameter);
    var rand = genRandom(spec.seed).random;

    shape.forEach(function(point) {        
        point[0] += (rand() * 2 - 1) * .2 * spec.diameter;
        point[1] += (rand() * 2 - 1) * .2 * spec.diameter;
    });

    var geometry = engine.extrude(shape, spec.height, spec.topScale);

    var point = new THREE.Vector3(0, 0, spec.height);

    var rot = (Math.PI * 2) / (spec.topFacets * 2);

    for (var i = 0; i < spec.topFacets; i++) {
        var offset = (rand() * 2 - 1) * .05;
        var slopeOffset = (rand() * 2 - 1) * .1;
        var angle = i / spec.topFacets + rot + offset;
        var plane = topPlane(
            spec.topSlope + slopeOffset,
            angle,
            point
        );
        geometry = engine.slice(geometry, plane);
    }

    var plane = topPlane(
        spec.topSlope * .5,
        0,
        point.clone().multiplyScalar(.9)
    );
    // geometry = engine.slice(geometry, plane);

    return engine.asThreeGeometry(geometry);
}

var ThreeEngine = function() {
    this.size = 100;
    this.box = new THREE.Mesh(new THREE.BoxGeometry(
        this.size,
        this.size,
        this.size
    ));
};

ThreeEngine.prototype = {

    extrude: function(shape, height, scale) {
        var tShape = new THREE.Shape();
        tShape.moveTo(shape[0][0], shape[0][1]);
        shape.slice(1).forEach(function(point) {
            tShape.lineTo(point[0], point[1]);
        });
        tShape.lineTo(shape[0][0], shape[0][1]);
        var geometry = new THREE.ExtrudeGeometry(tShape, {
            steps: 1,
            amount: height,
            bevelEnabled: false
        });
        for (var i = 0; i < shape.length; i++) {
            var v = geometry.vertices[i + shape.length];
            v.x = v.x * scale;
            v.y = v.y * scale;
        }
        return new ThreeBSP(geometry);
    },

    slice: function(geometryBSP, plane) {
        var normal = new THREE.Vector3().fromArray(plane[0]);
        var tPlane = new THREE.Plane(normal, plane[1]);
    
        this.box.position.copy(normal);
        var dist = this.size * .5 + tPlane.constant;
        this.box.position.multiplyScalar(dist * -1);
        this.box.lookAt(normal);
    
        var boxBSP = new ThreeBSP(this.box);
        return geometryBSP.subtract(boxBSP);
    },

    asThreeGeometry: function(geometryBSP) {
        return geometryBSP.toGeometry();
    }
};

var threeEngine = new ThreeEngine();


function polygon(sides, size) {
    var points = Array.apply(null, Array(sides));
    points = points.map(function(u, i) {
        var angle = i / sides * Math.PI * 2.;
        return [
            Math.sin(angle) * size,
            Math.cos(angle) * size
        ];
    });
    return points;
}

module.exports = create;
