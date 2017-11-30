const Controls = function(el, app) {

    const history = app.history;
    const eventMediator = app.eventMediator;

    const undoEl = document.querySelector('.controls-undo');
    const muteEl = document.querySelector('.controls-mute');

    this.eventMediator = eventMediator;
    this.muted = false;

    undoEl.addEventListener('click', history.undo.bind(history));
    muteEl.addEventListener('click', this.toggleMute.bind(this));

    eventMediator.on('history', () => {
        if (history.undoStack.length) {
            undoEl.removeAttribute('disabled');
        } else {
            undoEl.setAttribute('disabled', '');
        }
    });
};

Controls.prototype.toggleMute = function() {
    if (this.muted) {
        this.eventMediator.emit('unmute');
        document.body.classList.remove('muted');
        this.muted = false;
    } else {
        this.eventMediator.emit('mute');
        document.body.classList.add('muted');
        this.muted = true;
    }
};

module.exports = Controls;
