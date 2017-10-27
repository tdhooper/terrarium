
const History = function(eventMediator) {
    this.eventMediator = eventMediator;
    this.undoStack = [];
    this.redoStack = [];
    this.publishUpdates();
};

History.prototype.add = function(entry) {
    this.undoStack.push(entry);
    this.publishUpdates();
};

History.prototype.undo = function() {
    const entry = this.undoStack.pop();
    entry.destroy();
    this.redoStack.push(entry);
    this.publishUpdates();
};

History.prototype.redo = function() {
    const entry = this.redoStack.pop();
    entry.restore();
    this.undoStack.push(entry);
    this.publishUpdates();
};

History.prototype.publishUpdates = function() {
    this.eventMediator.emit('history');
};

module.exports = History;
