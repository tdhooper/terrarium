
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
};

module.exports = Controller;
