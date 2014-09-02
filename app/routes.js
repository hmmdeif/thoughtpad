var fs = require('fs'),
    compiler = require('./compiler/compiler');

var registerRoutes = function (app) {
    // Default root domain
    app.get('/', function *(next) {
        return yield routeToHostedApp(this);
    });

    // Anything after the root domain needs to be translated and sent to the client
    app.get(/.*/, function *(next) {
        return yield routeToHostedApp(this);
    });
},

// Check filesystem that the folder for the hostname exists before trying to serve it
hostnameIsValid = function (hostname) {
    return fs.existsSync(__dirname + '/../out/' + hostname);
},

routeToHostedApp = function *(ctx) {
    var s,
        ext,
        end = '/';

    if (hostnameIsValid(ctx.hostname)) {

        if (!ctx.path) {
            ctx.path = '';
        }

        s = ctx.path.split('.');
        ext = s[s.length - 1];

        // Accept only certain mime types and send the files
        switch (ext) {
        case "js":
        case "html":
        case "css":
        case "ttf":
        case "ico":
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
            end = '';
            break;
        }
        return yield ctx.fileServer.send(ctx.hostname + ctx.path + end);
    }
    return false;
};

module.exports = {
    registerRoutes: registerRoutes
}
