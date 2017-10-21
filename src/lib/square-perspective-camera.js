const THREE = require('three');

const _Math = THREE.Math;


function SquarePerspectiveCamera( fov, aspect, near, far ) {
    THREE.PerspectiveCamera.call( this );
};

SquarePerspectiveCamera.prototype = Object.assign( Object.create( THREE.PerspectiveCamera.prototype ), {

    constructor: SquarePerspectiveCamera,

    updateProjectionMatrix: function () {

        if (this.aspect > 1) {

            var near = this.near,
                top = near * Math.tan(
                        _Math.DEG2RAD * 0.5 * this.fov ) / this.zoom,
                height = 2 * top,
                width = this.aspect * height,
                left = - 0.5 * width,
                view = this.view;

        } else {

            var near = this.near,
                left = -near * Math.tan(
                        _Math.DEG2RAD * 0.5 * this.fov ) / this.zoom,
                width = -2 * left,
                height = (1 / this.aspect) * width,
                top =   0.5 * height,
                view = this.view;

        }

        if ( view !== null ) {

            var fullWidth = view.fullWidth,
                fullHeight = view.fullHeight;

            left += view.offsetX * width / fullWidth;
            top -= view.offsetY * height / fullHeight;
            width *= view.width / fullWidth;
            height *= view.height / fullHeight;

        }

        var skew = this.filmOffset;
        if ( skew !== 0 ) left += near * skew / this.getFilmWidth();

        this.projectionMatrix.makePerspective( left, left + width, top, top - height, near, this.far );

    }
});

module.exports = SquarePerspectiveCamera;
