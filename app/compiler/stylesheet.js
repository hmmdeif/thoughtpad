var stylus = require('stylus'),
    nib = require('nib'),
    fs = require('co-fs'),
    co = require('co'),
    uglify = require('uglifycss'),
    logger = require('./../logger'),
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

compileScript = function *(filepath, newFileName) {
    var parts = filepath.split("."),
        ext = parts[parts.length - 1],
        contents;

    switch (ext) {
    case "styl":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = stylus(contents).use(nib()).render()
        yield fs.writeFile(newFileName, contents);
        break;
    case "css":
    default:
        contents = yield fs.readFile(filepath, 'utf8');
        yield fs.writeFile(newFileName, contents)
        break;
    }
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
    logger.compiler("\n  Bundling stylesheet files: 0/" + totalBundles);

    for (bundle in bundles) {
        files = bundles[bundle];
        i = 0;
        len = files.length;
        compiledFiles = [];
        count++;
        logger.clearCompiler("  Bundling stylesheet files: " + count + "/" + totalBundles);

        for (i; i < len; i++) {
            compiledFiles.push(_preout + i.toString() + '.css');
            yield compileScript(_hostname + files[i], compiledFiles[i]);
        }

        result = uglify.processFiles(compiledFiles);
        yield fs.writeFile(_preout + bundle + ".css", result);
        yield removeNonBundledFiles(compiledFiles);
    }
    logger.info(" Done!");
}

module.exports = {
    compile: compile
}
