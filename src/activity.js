
const INACTIVE_DELAY = 2500;

function ActivityMonitor() {
    this.active();
    document.addEventListener('mousemove', this.active.bind(this));
    document.addEventListener('mousedown', this.active.bind(this));
    document.addEventListener('mouseup', this.active.bind(this));
    document.addEventListener('keydown', this.active.bind(this));
    document.addEventListener('keyup', this.active.bind(this));
    document.addEventListener('touchstart', this.active.bind(this));
    document.addEventListener('touchmove', this.active.bind(this));
    document.addEventListener('touchend', this.active.bind(this));
}

ActivityMonitor.prototype.clearTimeout = function() {
    if (this.timeout) {
        clearTimeout(this.timeout);
        delete this.timeout;
    }
};

ActivityMonitor.prototype.active = function() {
    this.clearTimeout();
    this.timeout = setTimeout(this.inactive.bind(this), INACTIVE_DELAY);
    if ( ! this.isActive) {
        this.isActive = true;
        document.body.classList.remove('activity-monitor-inactive');
    }
};

ActivityMonitor.prototype.inactive = function() {
    this.clearTimeout();
    if (this.isActive) {
        this.isActive = false;
        document.body.classList.add('activity-monitor-inactive');
    }
};

module.exports = ActivityMonitor;
