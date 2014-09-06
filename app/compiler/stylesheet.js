var stylus = require('stylus'),
    nib = require('nib'),
    fs = require('co-fs'),
    fsp = require('co-fs-plus'),
    co = require('co'),
    path = require('path'),
    uglify = require('uglifycss'),
    logger = require('./../logger'),
    appConfig = require('./../config'),
    fileWriter = require('./fileWriter'),
    _hostname,
    _preout,
    config;

var getBundles = function (hostname) {
    config = require(hostname + "/config.js");
    return config.cssCollections;
},

removeNonBundledFiles = function *(compiledFiles) {
    var i = 0,
        len = compiledFiles.length;

    for (i; i < len; i++) {
        yield fs.unlink(compiledFiles[i]);
    }
},

compileScript = function *(file, currentFolder, newFolder, compiledFiles) {
    var ext = path.extname(file),
        filepath = currentFolder + file,
        newFilePath = newFolder + path.basename(file, ext),
        contents;

    switch (ext) {
    case ".styl":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = stylus(contents).use(nib()).render()
        yield fs.writeFile(newFilePath, contents);
        break;
    case ".css":
    default:
        contents = yield fs.readFile(filepath, 'utf8');
        newFilePath += ".css";
        yield fs.writeFile(newFilePath, contents)
        break;
    }

    if (compiledFiles)  compiledFiles.push(newFilePath);
    return;
};

compile = function *(hostname, cache) {
    var compiledFiles = [],
        result,
        bundles = getBundles(hostname),
        totalBundles = Object.keys(bundles).length,
        i,
        count = 0,
        len,
        files,
        exists,
        bundle;

    _hostname = hostname + "/documents/styles/";
    _preout = hostname + "/pre_out/styles/";

    yield fs.mkdir(_preout);

    if (appConfig[appConfig.mode].bundleJs) {
        logger.compiler("\n  Bundling stylesheet files: 0/" + totalBundles);
        for (bundle in bundles) {
            files = bundles[bundle];
            i = 0;
            len = files.length;
            compiledFiles = [];
            count++;
            logger.clearCompiler("  Bundling stylesheet files: " + count + "/" + totalBundles);

            for (i; i < len; i++) {
                yield compileScript(files[i], _hostname, _preout, compiledFiles);
            }

            result = uglify.processFiles(compiledFiles);
            yield removeNonBundledFiles(compiledFiles);
            yield fs.writeFile(_preout + bundle + ".css", result);
        }
    } else {
        bundles = yield fsp.readdir(_hostname, null, []);
        i = 0;
        len = bundles.length;
        totalBundles = len > 0 ? len - 1 : 0;

        logger.compiler("\n  Compiling stylesheet files: 0/" + totalBundles);
        for (i; i < len; i++) {
            yield compileScript(path.basename(bundles[i]), _hostname, _preout);
            logger.clearCompiler("  Compiling stylesheet files: " + i + "/" + totalBundles);
        }
    }
    logger.info(" Done!");
}

module.exports = {
    compile: compile
}
