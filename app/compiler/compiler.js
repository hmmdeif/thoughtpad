var js = require('./javascript'),
    css = require('./stylesheet'),
    fileWriter = require('./fileWriter'),
    logger = require('./../logger'),
    html = require('./html'),
    fs = require('co-fs'),
    path = require('path'),
    fsp = require('co-fs-plus');

var getHostnames = function *() {
    return yield fs.readdir(__dirname + "/../../src/");
},

cleanPreout = function *(preoutFolder) {
    if (yield fs.exists(preoutFolder)) {
        yield removeDirectory(preoutFolder);
    }
    yield fs.mkdir(preoutFolder);
},

copyPreoutToLive = function *(outDirectory, preoutDirectory, cache) {
    var preoutFiles = yield fsp.readdir(preoutDirectory, null, []),
        i = 0,
        file,
        len = preoutFiles.length;

    for (i; i < len; i++) {
        file = yield fs.readFile(preoutFiles[i]);
        yield fileWriter.copyFile(outDirectory + preoutFiles[i].split('pre_out')[1], file);
    }

},

copyStaticFilesToLive = function *(outDirectory, staticFileDirectory, cache) {
    var staticFiles = yield fsp.readdir(staticFileDirectory, null, []),
        i = 0,
        file,
        len = staticFiles.length;

    for (i; i < len; i++) {
        file = yield fs.readFile(staticFiles[i]);
        yield fileWriter.copyFile(outDirectory + staticFiles[i].split('files')[1], file);
    }
},

copyToLive = function *(outDirectory, preoutDirectory, staticFileDirectory, cache) {
    if (yield fs.exists(outDirectory)) {
        yield removeDirectory(outDirectory);
    }

    yield fs.mkdir(outDirectory);
    yield copyPreoutToLive(outDirectory, preoutDirectory, cache);
    yield copyStaticFilesToLive(outDirectory, staticFileDirectory, cache);
},

removeDirectory = function *(folder) {
    var files = yield fs.readdir(folder),
        i = 0,
        len = files.length,
        curPath,
        stat;

    for (i; i < len; i++) {
        curPath = folder + "/" + files[i];
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
    compile: function *(cache, hostname) {
        var hostnames = [hostname],
            currentHostname = '',
            outDirectory,
            preoutDirectory,
            staticFileDirectory,
            i = 0,
            len = 1;

        if (!hostnames[0]) {
            hostnames = yield getHostnames();
            len = hostnames.length
        }

        logger.compiler('\nStarting site compilation...');
        for (i; i < len; i++) {
            logger.compiler('\nCompiling ' + hostnames[i] + ":");
            currentHostname = path.normalize(__dirname + "/../../src/" + hostnames[i]);
            outDirectory = path.normalize(__dirname + "/../../out/" + hostnames[i]);
            preoutDirectory = currentHostname + "/pre_out/";
            staticFileDirectory = currentHostname + "/files/";
            yield cleanPreout(currentHostname + "/pre_out/");

            yield js.compile(currentHostname, hostnames[i], cache);
            yield css.compile(currentHostname, cache);
            yield html.compile(currentHostname, cache);

            logger.compiler('\n  Copying new files to live directory');
            yield copyToLive(outDirectory, preoutDirectory, staticFileDirectory, cache);
            logger.info(" Done!");
        }
    }
}
