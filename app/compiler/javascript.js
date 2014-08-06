var coffee = require('coffee-script'),
    fs = require('co-fs'),
    co = require('co'),
    uglify = require('uglify-js'),
    logger = require('./../logger'),
    _hostname,
    _preout,
    config;

var getBundles = function (hostname) {
    config = require(hostname + "\\config.js");
    return config.scriptCollections;
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
    case "coffee":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = coffee.compile(contents, { bare: true });
        yield fs.writeFile(newFileName, contents);
        break;
    case "js":
    default:
        contents = yield fs.readFile(filepath, 'utf8');
        yield fs.writeFile(newFileName, contents);
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

    _hostname = hostname + "\\documents\\scripts\\";
    _preout = hostname + "\\pre_out\\scripts\\";

    yield fs.mkdir(_preout);
    logger.compiler("\n  Bundling javascript files: 0/" + totalBundles);

    for (bundle in bundles) {
        files = bundles[bundle];
        i = 0;
        len = files.length;
        compiledFiles = [];
        count++;
        logger.clearCompiler("  Bundling javascript files: " + count + "/" + totalBundles);

        for (i; i < len; i++) {
            compiledFiles.push(_preout + i.toString() + '.js');
            yield compileScript(_hostname + files[i], compiledFiles[i]);
        }

        result = uglify.minify(compiledFiles);
        yield fs.writeFile(_preout + "bundled_" + bundle + ".js", result.code);
        yield removeNonBundledFiles(compiledFiles);

    }
    logger.info(" Done!");
}

module.exports = {
    compile: compile
}