var fs = require('fs');
const Ractive = require('ractive');

const Controls = function(el, app) {

    var template = fs.readFileSync(__dirname + '/templates/controls.html', 'utf8');
    var ractive = new Ractive({
        el: el,
        append: true,
        template: template,
        data: {
            undo: true
        }
    });
};

module.exports = Controls;
