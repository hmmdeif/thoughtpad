var nodemon = require('nodemon'),
    program = require('commander'),
    logger = require('./app/logger'),
    to;

program
    .version('1.0.0')
    .option('-w, --watch', 'Keep alive and watch folders for automatic build')
    .option('-p --production', 'Compile sites in production mode')
    .parse(process.argv);

startWatchedBuild = function () {

    nodemon.on('restart', function () {
        logger.general('\nRestarting Thoughtpad due to change');
        clearTimeout(to);
    }).on('crash', function () {
        logger.error('\nThoughtpad has crashed. Restarting in 5 seconds');
        to = setTimeout(function () {
            nodemon.emit('restart');
        }, 5000);
    }).on('start', function () {
        logger.info('\nThoughtpad application booting');
    });

    nodemon({
        script: './app/app.js',
        ext: 'js',
        watch: ['app/*', 'app.js'],
        execMap: {
            js: "node"
        },
        verbose: true,
        args: process.argv
    });
};

if (program.watch) {
    startWatchedBuild();
} else {
    require('./app/app');
}
