var fs = require('co-fs'),
    primusServer;

var start = function (app) {
    var server;

    server = require('http').Server(app.callback());
    primusServer = new require('primus')(server, {parser: 'JSON', pathname: '/scripts'});

    primusServer.on('connection', function (spark) {
        console.log('got a connection');
    });
},

saveScript = function *(folder) {
    if (primusServer) {
        yield fs.writeFile(folder + injectScript(), primusServer.library());
    }
},

injectScript = function () {
    return 'primus.js'
}

module.exports = {
    start: start,
    injectScript: injectScript,
    saveScript: saveScript
}
