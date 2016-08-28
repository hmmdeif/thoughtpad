var program = require('commander')
    compiler = require('./compiler/compiler'),
    applogger = require('./logger'),
    co = require('co');

program
    .version('1.0.0')
    .option('-w, --watch', 'keep alive and watch folders for automatic build')
    .option('-p --production', 'compile sites in production mode')
    .parse(process.argv);

co(function *() {
    yield compiler.compile(program.production ? 'production' : 'development');
});
