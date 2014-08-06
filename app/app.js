var koa = require('koa'),
    router = require('koa-router'),
    logger = require('koa-logger'),
    app,
    compiler = require('./compiler/compiler'),
    applogger = require('./logger'),
    routes = require('./routes'),
    cluster = require('cluster'),
    config = require('./config'),
    mode = config.mode,
    numCPUs = require('os').cpus().length,
    serve = require('koa-file-server')({
        index: true
    }),
    worker;

if (cluster.isMaster) {
    // Fork workers - one for each CPU
    applogger.info('\nCreating ' + (numCPUs - 1) + ' server workers');
    for (var i = 0; i < numCPUs; i++) {
        worker = cluster.fork();
    }
    applogger.info("\nListening on port " + config[mode].port);

    // Once we've clustered the server, we can (re)compile all the hosted sites
    compiler.compile(serve.cache);

    cluster.on('exit', function(worker, code, signal) {
        if (signal !== "SIGUSR2") { // the nodemon restart signal
            applogger.error('\nWorker ' + worker.process.pid + ' has died. Adding new worker');
            cluster.fork();
        }
    });
} else {
    app = koa();
    app.use(logger());
    app.use(serve);
    app.use(router(app));
    routes.registerRoutes(app);

    app.listen(config[mode].port);
}
