
const INACTIVE_DELAY = 2500;

function ActivityMonitor() {
    this.isActive = true;
    this.setInactive();

    document.addEventListener('mousemove', this.move.bind(this));
    document.addEventListener('touchmove', this.move.bind(this));

    document.addEventListener('keydown', this.start.bind(this));
    document.addEventListener('mousedown', this.start.bind(this));
    document.addEventListener('touchstart', this.start.bind(this));

    document.addEventListener('mouseup', this.end.bind(this));
    document.addEventListener('touchend', this.end.bind(this));
    document.addEventListener('keyup', this.end.bind(this));
}

ActivityMonitor.prototype.clearTimeout = function() {
    if (this.timeout) {
        clearTimeout(this.timeout);
        delete this.timeout;
    }
};

ActivityMonitor.prototype.move = function() {
    this.end();
};

ActivityMonitor.prototype.start = function() {
    this.clearTimeout();
    this.setActive();
};

ActivityMonitor.prototype.end = function() {
    this.clearTimeout();
    this.timeout = setTimeout(() => {
        this.clearTimeout();
        this.setInactive();
    }, INACTIVE_DELAY);
    this.setActive();
};

ActivityMonitor.prototype.setActive = function() {
    if ( ! this.isActive) {
        this.isActive = true;
        document.body.classList.remove('activity-monitor-inactive');
    }
};

ActivityMonitor.prototype.setInactive = function() {
    if (this.isActive) {
        this.isActive = false;
        document.body.classList.add('activity-monitor-inactive');
    }
};

module.exports = ActivityMonitor;
