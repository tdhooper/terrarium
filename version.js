const Version = require("node-version-assets");


const version = new Version({
    assets: [
        'build/index.js',
        'build/styles/main.css'
    ],
    grepFiles: ['build/index.html']
});

version.run();
