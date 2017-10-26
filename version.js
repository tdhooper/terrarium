const Version = require("node-version-assets");


const version = new Version({
    assets: ['js/index.js'],
    grepFiles: ['index.html']
});

version.run();
