var nodemon = require('nodemon'),
    logger = require('./app/logger'),
    config = require('./app/config'),
    mode = config.mode,
    to,

startDevServer = function () {
    nodemon({
        script: './app/app.js',
        ext: 'js',
        watch: ['app/*', 'app.js'],
        execMap: {
            js: "node --harmony"
        },
        verbose: true
    });

    nodemon.on('restart', function () {
        logger.general('\nRestarting server due to change');
        clearTimeout(to);
    }).on('crash', function () {
        logger.error('\nServer has crashed. Restarting server in 5 seconds');
        to = setTimeout(function () {
            nodemon.emit('restart');
        }, 5000);
    }).on('start', function () {
        logger.info('\nThoughtpad application booting');
    });
};

switch (mode) {
case "development":
    startDevServer();
    break;
case "production":
    startDevServer();
    break;
}
