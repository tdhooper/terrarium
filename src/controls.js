var fs = require('fs');
const Ractive = require('ractive');

const Controls = function(el, app) {

    const history = app.history;
    const eventMediator = app.eventMediator;

    const state = {
        undo: false,
        redo: false
    };
    const template = fs.readFileSync(__dirname + '/templates/controls.html', 'utf8');
    const ractive = new Ractive({
        el: el,
        append: true,
        template: template,
        data: state
    });

    ractive.on('undo', history.undo.bind(history));
    ractive.on('redo', history.redo.bind(history));

    eventMediator.on('history', function() {
        ractive.set('undo', !! history.undoStack.length);
        ractive.set('redo', !! history.redoStack.length);
    });
};

module.exports = Controls;
