var js = require('./javascript'),
    css = require('./stylesheet'),
    fileWriter = require('./fileWriter'),
    logger = require('./../logger'),
    html = require('./html'),
    fs = require('co-fs'),
    path = require('path'),
    defaultConfig = require('./defaultConfig'),
    register = require('./pluginRegister');

var getHostnames = function *() {
    return yield fs.readdir(__dirname + "/../../src/");
},

copyToLive = function *(outDir, preoutDir, staticFileDir, cache) {
    yield fileWriter.remakeDirectory(outDir);
    yield fileWriter.copyDirectory(preoutDir, outDir);
    yield fileWriter.copyDirectory(staticFileDir, outDir);
},

addDefaultConfigValues = function (thoughtpad) {
    var key,
        addToConfig = function (layer, configLayer) {
            var key;
            for (key in layer) {
                if (configLayer[key]) {
                    if (typeof configLayer[key] === "object") {
                        addToConfig(layer[key], configLayer[key]);
                    } 
                } else if (!configLayer[key]) {
                    configLayer[key] = layer[key];
                }
            }
        };

    addToConfig(defaultConfig, thoughtpad.config);

};

module.exports = {
    compile: function *(server, cache, mode, hostname) {
        var hostnames = [hostname],
            currentHostname = '',
            outDir,
            preoutDir,
            staticFileDir,
            i = 0,
            len = 1,
            config,
            thoughtpad,
            folders;

        if (!hostnames[0]) {
            hostnames = yield getHostnames();
            len = hostnames.length
        }        

        logger.compiler('\nStarting site compilation...');
        for (i; i < len; i++) {
            config = require(__dirname + "/../../src/" + hostnames[i] + "/config.js");
            thoughtpad = register.initModules(config, mode);

            yield thoughtpad.notify('initialise-complete', server);

            logger.compiler('\nCompiling ' + hostnames[i] + ":");
            currentHostname = path.normalize(__dirname + "/../../src/" + hostnames[i]).replace(/\\/g, "/");
            outDir = path.normalize(__dirname + "/../../out/" + hostnames[i]).replace(/\\/g, "/");
            preoutDir = currentHostname + "/pre_out/";
            staticFileDir = currentHostname + "/files/";
            yield fileWriter.remakeDirectory(currentHostname + "/pre_out/");

            thoughtpad.folders = {
                preout: preoutDir,
                hostname: currentHostname,
                scripts: currentHostname + "/documents/scripts/",
                preoutScripts: preoutDir + "scripts/",
                stylesheets: currentHostname + "/documents/styles/",
                preoutStylesheets: preoutDir + "styles/",
                layouts: currentHostname + "/layouts/",
                posts: currentHostname + "/documents/posts/"
            };

            addDefaultConfigValues(thoughtpad);

            yield js.compile(thoughtpad, cache);
            yield css.compile(thoughtpad, cache);
            yield html.compile(thoughtpad, cache);

            logger.compiler('\n  Copying new files to live directory');
            yield copyToLive(outDir, preoutDir, staticFileDir, cache);
            logger.info(" Done!");
        }
    }
}