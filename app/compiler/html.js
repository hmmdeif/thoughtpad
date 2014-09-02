var coffee = require('coffeekup'),
    fs = require('co-fs'),
    co = require('co'),
    minifier = require('html-minifier').minify,
    logger = require('./../logger'),
    markdown = require('markdown').markdown,
    appConfig = require('./../config');

var getConfig = function (hostname) {
    return require(hostname + "/config.js");
},

rewriteBundles = function (page, folderLocations, newFileName, config) {
    var levelsForBundles,
        levelString = "",
        p,
        i = 0,
        len,
        parts = page.url.split("."),
        ext = parts[parts.length - 1],
        cleanPageUrl = page.url.replace(".html." + ext, "/");

    levelsForBundles = newFileName.replace(folderLocations.preout, "").split("/").length;
    for (i; i < levelsForBundles; i++) {
        levelString += "../"
    }

    // If we're not bundling then we want to pass the array of files rather than the bundle name
    if (!appConfig[appConfig.mode].bundleJs) {
        page.scriptBundle = config.scriptCollections[page.scriptBundle];
        i = 0;
        len = page.scriptBundle.length;
        for (i; i < len; i++) {
            page.scriptBundle[i] = levelString + "scripts/" + page.scriptBundle[i];
        }
    } else {
        page.scriptBundle = levelString + "scripts/" + page.scriptBundle;
    }
    if (!appConfig[appConfig.mode].bundleCss) {
        page.cssBundle = config.cssCollections[page.cssBundle];
        i = 0;
        len = page.cssBundle.length;
        for (i; i < len; i++) {
            page.cssBundle[i] = levelString + "styles/" + page.cssBundle[i];
        }
    } else {
         page.cssBundle = levelString + "styles/" + page.cssBundle;
    }

    page.url = levelString + cleanPageUrl;
    if (page.pages) {
        for (p in page.pages) {
            page.pages[p].url = page.url + p;
        }
    }
},

compileLayout = function *(page, newFileName, layoutData, config, folderLocations) {
    var parts = layoutData[page.layout].url.split("."),
        ext = parts[parts.length - 1],
        layoutContents = layoutData[page.layout].contents,
        contents;

    rewriteBundles(page, folderLocations, newFileName, config);

    switch (ext) {
    case "coffee":
        contents = coffee.render(layoutContents, { document: page, site: config.templateData.site, func: config.templateData.func });
        break;
    case "html":
    default:

        break;
    }

    if (layoutData[page.layout].dependsOn) {
        page.layout = layoutData[page.layout].dependsOn;
        page.content = contents;
        yield compileLayout(page, newFileName, layoutData, config, folderLocations);
    } else {
        yield fs.writeFile(newFileName, minifier(contents, { collapseWhitespace: true }));

        // The index is a special case page that sits in the topmost directory
        if (page.index) {
            yield fs.writeFile(folderLocations.preout + "index.html", minifier(contents, { collapseWhitespace: true }));
        }
    }

},

getLayoutData = function *(layouts, folderLocations, layoutData, dependsOn) {
    var layout,
        contents;

    if (!layoutData) {
        layoutData = {};
    }

    if (layouts) {
        for (layout in layouts) {
            contents = yield fs.readFile(folderLocations.layoutFolder + layouts[layout].url, 'utf8');
            layoutData[layout] = { contents: contents, url: layouts[layout].url, dependsOn: dependsOn };
            if (layouts[layout].layouts) {
                layoutData = yield getLayoutData(layouts[layout].layouts, folderLocations, layoutData, layout);
            }
        }
    }
    return layoutData;
},

compilePage = function *(page, folder, layoutData, folderLocations, config) {
    var parts = page.url.split("."),
        ext = parts[parts.length - 1],
        filepath = folderLocations.postFolder + page.url,
        folderName = folderLocations.preout + folder + page.url.replace(".html." + ext, "/"),
        newFileName = folderName + "index.html",
        exists = yield fs.exists(folderName),
        contents;

    switch (ext) {
    case "md":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = markdown.toHTML(contents);
        break;
    case "coffee":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = coffee.render(contents, { document: page });
        break;
    case "html":
    default:

        break;
    }

    if (!exists) {
        yield fs.mkdir(folderName);
    }

    if (page.layout) {
        page.content = contents;
        yield compileLayout(page, newFileName, layoutData, config, folderLocations);
    } else {
        yield fs.writeFile(newFileName, contents);
    }
    return contents;
},

compilePages = function *(pages, folder, layoutData, count, totalPageSets, folderLocations, config) {
    var page,
        exists;

    if (pages) {
        for (page in pages) {
            exists = yield fs.exists(folderLocations.preout + folder);
            if (!exists) {
                yield fs.mkdir(folderLocations.preout + folder);
            }
            exists = yield fs.exists(folderLocations.preout + folder + page);
            if (!exists && pages[page].pages) {
                yield fs.mkdir(folderLocations.preout + folder + page);
            }

            // Compile the very bottom of the stack first so that when we go up we can dynamically add the content in
            pages[page].pages = yield compilePages(pages[page].pages, folder + "/" + page + "/", layoutData, count, totalPageSets, folderLocations, config);

            // Now compile the current level as there will likely be a dependency
            pages[page].content = yield compilePage(pages[page], folder, layoutData, folderLocations, config);

            if (folder === "") {
                count++;
                logger.clearCompiler("  Compiling page sets: " + count + "/" + totalPageSets);
            }
        }
    }

    return pages;
},

compile = function *(hostname, cache) {
    var compiledFiles = [],
        result,
        config = getConfig(hostname),
        layouts = config.layouts,
        pages = config.pages,
        totalPageSets = Object.keys(pages).length,
        count = 0,
        i,
        len,
        files,
        bundle,
        layoutData,
        folderLocations = {
            layoutFolder: hostname + "/layouts/",
            postFolder: hostname + "/documents/posts/",
            hostname: hostname + "/documents/",
            preout: hostname + "/pre_out/"
        };

    logger.compiler("\n  Compiling page sets: 0/" + totalPageSets);

    // First save the layout data to memory (saves file io when compiling each page and it is unlikely to have many layouts)
    layoutData = yield getLayoutData(layouts, folderLocations);

    // Compile each page in turn
    yield compilePages(pages, "", layoutData, count, totalPageSets, folderLocations, config);
    logger.info(" Done!");
};

module.exports = {
    compile: compile
}
