var js = require('./javascript'),
    css = require('./stylesheet'),
    logger = require('./../logger'),
    html = require('./html'),
    fs = require('co-fs'),
    co = require('co');

var getHostnames = function *() {
    return yield fs.readdir(__dirname + "\\..\\..\\src\\");
},

cleanPreout = function *(preoutFolder) {
    if (yield fs.exists(preoutFolder)) {
        yield removeDirectory(preoutFolder);
    }
    yield fs.mkdir(preoutFolder);
},

removeDirectory = function *(folder) {
    var files = yield fs.readdir(folder),
        i = 0,
        len = files.length,
        curPath,
        stat;

    for (i; i < len; i++) {
        curPath = folder + "\\" + files[i];
        isDirectory = false;

        stat = yield fs.lstat(curPath);

        if (stat.isDirectory()) { // recurse
            yield removeDirectory(curPath);
        } else { // delete file
            yield fs.unlink(curPath);
        }
    }
    yield fs.rmdir(folder);
    return;
};

module.exports = {
    compile: function (cache) {
        co(function *() {
            var hostnames = yield getHostnames(),
                currentHostname = '',
                i = 0,
                len = hostnames.length;

            logger.compiler('\nStarting site compilation...');
            for (i; i < len; i++) {
                logger.compiler('\nCompiling ' + hostnames[i] + ":");
                currentHostname = __dirname + "\\..\\..\\src\\" + hostnames[i];
                yield cleanPreout(currentHostname + "\\pre_out\\");

                yield js.compile(currentHostname, cache);
                yield css.compile(currentHostname, cache);
                yield html.compile(currentHostname, cache);
            }
        })();
    }
}