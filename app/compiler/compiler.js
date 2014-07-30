var js = require('./javascript'),
    css = require('./stylesheet'),
    fs = require('co-fs'),
    co = require('co');

var getHostnames = function *() {
    return yield fs.readdir(__dirname + "\\..\\..\\src\\");
};

module.exports = {
    compile: function (cache) {
        co(function *() {
            var hostnames = yield getHostnames(),
                currentHostname = '',
                i = 0,
                len = hostnames.length;

            for (i; i < len; i++) {
                currentHostname = __dirname + "\\..\\..\\src\\" + hostnames[i];
                js.compile(currentHostname, cache);
                css.compile(currentHostname, cache);
            }
        })();
    }
}