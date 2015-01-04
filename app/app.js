var koa = require('koa'),
    http = require('http'),
    router = require('koa-router'),
    logger = require('koa-logger'),
    app,
    compiler = require('./compiler/compiler'),
    applogger = require('./logger'),
    routes = require('./routes'),
    cluster = require('cluster'),
    config = require('./config'),
    fs = require('co-fs'),
    mode = config.mode,
    numCPUs = require('os').cpus().length,
    serve,
    worker,
    server,
    co = require('co'),
    getRealDirName = function *() {
        var realDirName = yield fs.realpath(__dirname + "/../out/");
        serve = require('koa-file-server')({
            root: realDirName,
            index: true
        });
    },
    startListenServer = function *() {
        yield getRealDirName();

        app = module.exports = koa();
        app.use(logger());
        app.use(serve);
        app.use(router(app));
        routes.registerRoutes(app);

        return http.createServer(app.callback());
    };

if (cluster.isMaster && !module.parent) {
    cluster.on('exit', function(worker, code, signal) {
        if (signal !== "SIGUSR2") { // the nodemon restart signal
            applogger.error('\nWorker ' + worker.process.pid + ' has died. Adding new worker');
            cluster.fork();
        }
    });

    // Once we've clustered the server, we can (re)compile all the hosted sites
    co(function *() {
        yield getRealDirName();

        if (config.mode === "development") {
            server = yield startListenServer();
            server.listen(config[mode].port);

        } else {
            // Fork workers - one for each CPU
            applogger.info('\nCreating ' + (numCPUs - 1) + ' server workers');
            for (var i = 0; i < numCPUs; i++) {
                worker = cluster.fork();
            }
        }
        applogger.info("\nListening on port " + config[mode].port);

        yield compiler.compile(server, serve.cache, mode);
    })();


} else if (config.mode !== "development") {
    co(function *() {
        server = yield startListenServer();
        server.listen(config[mode].port);
    })();
}
