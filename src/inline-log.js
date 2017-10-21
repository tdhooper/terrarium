var $ = require('jquery');


const InlineLog = function() {
    this.$el = $('<textarea />').addClass('log');
    this.$el.appendTo('body');
};

InlineLog.prototype.log = function(message) {
    this.$el.text(this.$el.text() + message + '\n');
    this.$el.scrollTop(this.$el[0].scrollHeight);
};

InlineLog.prototype.clear = function(message) {
    this.$el.text('');
};

module.exports = InlineLog;
