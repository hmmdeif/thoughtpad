var fs = require('co-fs'),
    config = require('./../config'),
    logger = require('./../logger'),
    Primus = require('primus'),
    primusServer;

var start = function (server) {
    var server;

    primusServer = new Primus(server, {parser: 'JSON'});

    primusServer.on('connection', function (spark) {
        logger.info('\nConnected to a new client');
    });
},

getBrowserScript = function (hostname) {
    return ' \
        (function() { \
            var primus = Primus.connect(); \
            primus.on("data", function (data) { \
                if (data === "compileComplete") { \
                    document.localtion.reload(); \
                } \
            }); \
            primus.on("open", function () { \
                console.log("Connected to development server"); \
            }); \
            primus.on("error", function (err) { \
                console.log("Error: ", err, err.message); \
            }); \
            primus.on("reconnect", function () { \
                console.log("Reconnect attempt started"); \
            }); \
            primus.on("reconnecting", function (opts) { \
                console.log("Reconnecting in %d ms", opts.timeout); \
                console.log("This is attempt %d out of %d", opts.attempt, opts.retries); \
            }); \
            primus.on("end", function () { \
                console.log("Connection closed"); \
            }); \
        })(); \
    ';

}

saveScript = function *(folder, hostname) {
    if (primusServer) {
        yield fs.writeFile(folder + injectScript(), primusServer.library());
        yield fs.writeFile(folder + browserScript(), getBrowserScript(hostname));
    }
},

injectScript = function () {
    return 'primus.js';
},

browserScript = function () {
    return 'primus-browser.js';
};

module.exports = {
    start: start,
    injectScript: injectScript,
    browserScript: browserScript,
    saveScript: saveScript
}
