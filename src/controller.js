const materials = require('./materials');


const Controller = function(app) {

    const eventMediator = app.eventMediator;

    var highlightTimeout;

    eventMediator.on('ready', () => {
        highlightTimeout = setTimeout(() => {
            highlightTimeout = undefined;
            app.terrarium.soil.showHighlight(true);
        }, 4000);
    });

    eventMediator.on('crystal.growth', () => {
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
            highlightTimeout = undefined;
        } else {
            app.terrarium.soil.showHighlight(false);
        }
    });

    var hyperDecay = .1; // per second
    var minDelta = 1000 / 60;

    app.eventMediator.on('update', function() {
        if (app.delta) {
            var decay = THREE.Math.lerp(1, hyperDecay, app.delta / 1000);
            app.space.hyperMultiplier = Math.max(0, app.space.hyperMultiplier * decay);
        }
        // app.hyperMap.update();
    });

    app.eventMediator.on('crystal.click', function() {
        // app.space.hyperMultiplier = Math.min(Math.pow(app.space.hyperMultiplier + 1, 1.5), 20);
        app.space.hyperMultiplier += 5;
    });
};

module.exports = Controller;
