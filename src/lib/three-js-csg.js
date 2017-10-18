InitThreeBSP = require('ThreeCSG')

module.exports = function(THREE) {
    const ThreeBSP = InitThreeBSP(THREE);

    ThreeBSP.prototype.cut = function(other_tree) {
        var a = this.tree.clone(),
            b = other_tree.tree.clone();
        // a.invert();
        b.clipTo( a );
        b.invert();
        a.clipTo( b );
        a = new ThreeBSP( a );
        a.matrix = this.matrix;
        return a;
    }

    return ThreeBSP;
}