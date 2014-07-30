var koa = require('koa'),
    router = require('koa-router'),
    logger = require('koa-logger'),
    app,
    compiler = require('./compiler/compiler'),
    routes = require('./routes');

var start = function () {
    var serve = require('koa-file-server')({
        index: true
    });

    app = koa();
    app.use(logger());
    app.use(serve);
    app.use(router(app));
    routes.registerRoutes(app);

    app.listen(3000);

    // Once the server has started we can (re)compile all the hosted sites
    compiler.compile(serve.cache);
};

module.exports = {
    start: start
}