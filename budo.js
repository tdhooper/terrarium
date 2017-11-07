const fs = require('fs');
const fromString = require('from2-string');
const budo = require('budo');

budo('./index.js', {
    live: true,
    forceDefaultIndex: true,
    defaultIndex: function(params) {
        var template = fs.readFileSync('./index.template', 'utf8');
        template = template.replace('js/index.js', 'index.js');
        return fromString(template);
    }
}).on('connect', function(ev) {
  console.log('Server running on %s', ev.uri);
  console.log('LiveReload running on port %s', ev.livePort);
});
