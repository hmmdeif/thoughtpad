var coffee = require('coffee-script'),
    fs = require('co-fs'),
    fsp = require('co-fs-plus'),
    co = require('co'),
    path = require('path'),
    uglify = require('uglify-js'),
    logger = require('./../logger'),
    liveReload = require('./liveReload'),
    appConfig = require('./../config'),
    fileWriter = require('./fileWriter'),
    _hostname,
    _preout,
    config;

var getBundles = function (hostname) {
    config = require(hostname + "/config.js");
    return config.scriptCollections;
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
    case ".coffee":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = coffee.compile(contents, { bare: true });
        yield fs.writeFile(newFilePath, contents);
        break;
    case ".js":
    default:
        contents = yield fs.readFile(filepath, 'utf8');
        newFilePath += ".js";
        yield fs.writeFile(newFilePath, contents);
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
        bundle,
        scriptFiles;

    _hostname = hostname + "/documents/scripts/";
    _preout = hostname + "/pre_out/scripts/";

    yield fs.mkdir(_preout);

    if (appConfig[appConfig.mode].bundleJs) {
        logger.compiler("\n  Bundling javascript files: 0/" + totalBundles);

        for (bundle in bundles) {
            files = bundles[bundle];
            i = 0;
            len = files.length;
            compiledFiles = [];
            count++;
            logger.clearCompiler("  Bundling javascript files: " + count + "/" + totalBundles);

            for (i; i < len; i++) {
                yield compileScript(files[i], _hostname, _preout, compiledFiles);
            }

            result = uglify.minify(compiledFiles);
            yield removeNonBundledFiles(compiledFiles);
            yield fs.writeFile(_preout + bundle + ".js", result.code);

        }
    } else {
        bundles = yield fsp.readdir(_hostname, null, []);
        i = 0;
        len = bundles.length;
        totalBundles = len > 0 ? len - 1 : 0;

        logger.compiler("\n  Compiling javascript files: 0/" + totalBundles);
        for (i; i < len; i++) {
            yield compileScript(path.basename(bundles[i]), _hostname, _preout);
            logger.clearCompiler("  Compiling javascript files: " + i + "/" + totalBundles);
        }

        if (appConfig.mode === "development") {
            yield liveReload.saveScript(_preout);
        }
    }
    logger.info(" Done!");
}

module.exports = {
    compile: compile
}
