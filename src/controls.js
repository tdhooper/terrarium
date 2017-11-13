const Controls = function(el, app) {

    const history = app.history;
    const eventMediator = app.eventMediator;

    const undoEl = document.querySelector('.controls-undo');

    undoEl.addEventListener('click', history.undo.bind(history));

    eventMediator.on('history', () => {
        if (history.undoStack.length) {
            undoEl.removeAttribute('disabled');
        } else {
            undoEl.setAttribute('disabled', '');
        }
    });
};

module.exports = Controls;
