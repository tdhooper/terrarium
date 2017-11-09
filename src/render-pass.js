const THREE = require('./lib/three');

/**
 * @author alteredq / http://alteredqualia.com/
 */

const RenderPass = function ( scene, camera, renderFunc ) {

    THREE.Pass.call( this );

    this.scene = scene;
    this.camera = camera;

    this.needsSwap = false;
    this.renderFunc = renderFunc;
    this.clear = false;
};

RenderPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

    constructor: THREE.RenderPass,

    render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

        // renderer.clear(true, true, true);

        const render = renderer.render.bind(
            renderer,
            this.scene,
            this.camera,
            this.renderToScreen ? null : readBuffer,
            this.clear
        );

        this.renderFunc(renderer, render);

    }

} );


module.exports = RenderPass;
