var coffee = require('coffeekup'),
    fs = require('co-fs'),
    co = require('co'),
    path = require('path'),
    liveReload = require('./liveReload'),
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
        ext = path.extname(page.url),
        collection,
        cleanPageUrl = page.url.replace(".html" + ext, "/");

    levelsForBundles = newFileName.replace(folderLocations.preout, "").split("/").length;
    for (i; i < levelsForBundles; i++) {
        levelString += "../"
    }

    // If we're not bundling then we want to pass the array of files rather than the bundle name
    if (!appConfig[appConfig.mode].bundleJs && typeof page.scriptBundle !== "object") {

        collection = config.scriptCollections[page.scriptBundle].slice();
        page.scriptBundle = [];
        i = 0;
        len = collection.length;
        for (i; i < len; i++) {
            page.scriptBundle.push(levelString + "scripts/" + collection[i]);
        }

        // Add the live reload script if we're in development mode
        if (appConfig.mode === "development") {
            page.scriptBundle.push(levelString + "scripts/" + liveReload.injectScript());
            page.scriptBundle.push(levelString + "scripts/" + liveReload.browserScript());
        }
    } else if (page.scriptBundle.indexOf("scripts/") === -1 && appConfig[appConfig.mode].bundleJs) {
        page.scriptBundle = levelString + "scripts/" + page.scriptBundle;
    }
    if (!appConfig[appConfig.mode].bundleCss && typeof page.cssBundle !== "object") {
        collection = config.cssCollections[page.cssBundle].slice();
        page.cssBundle = [];
        i = 0;
        len = collection.length;
        for (i; i < len; i++) {
            page.cssBundle.push(levelString + "styles/" + collection[i]);
        }
    } else if (page.cssBundle.indexOf("styles/") === -1 && appConfig[appConfig.mode].bundleCss) {
         page.cssBundle = levelString + "styles/" + page.cssBundle;
    }

},

compileLayout = function *(pages, page, layout, newFileName, layoutData, config, folderLocations) {
    var ext = path.extname(layoutData[layout].url),
        layoutContents = layoutData[layout].contents,
        contents;

    rewriteBundles(page, folderLocations, newFileName, config);

    switch (ext) {
    case ".coffee":
        contents = coffee.render(layoutContents, { document: page, site: config.templateData.site, func: config.templateData.func, pages: pages });
        break;
    case ".html":
    default:

        break;
    }

    if (layoutData[layout].dependsOn) {     
        page.content = contents;
        yield compileLayout(pages, page, layoutData[layout].dependsOn, newFileName, layoutData, config, folderLocations);
    } else  {
        if (appConfig.mode !== "development") {
            contents = minifier(contents, { collapseWhitespace: true })
        }
        yield fs.writeFile(newFileName, contents);
        // The index is a special case page that sits in the topmost directory
        if (page.index) {
            yield fs.writeFile(folderLocations.preout + "index.html", contents);
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

compilePage = function *(pages, page, folder, layoutData, folderLocations, config) {
    var ext = path.extname(page.url),
        filepath = folderLocations.postFolder + page.url,
        cleanPageUrl = page.url.replace(".html" + ext, "/"),
        folderName = folderLocations.preout + folder + cleanPageUrl,
        newFileName = folderName + "index.html",
        exists = yield fs.exists(folderName),
        contents = page.content;

    if (!contents) {
        switch (ext) {
        case ".md":
            contents = yield fs.readFile(filepath, 'utf8');
            contents = markdown.toHTML(contents);
            break;
        case ".coffee":
            contents = yield fs.readFile(filepath, 'utf8');
            contents = coffee.render(contents, { document: page, pages: pages });
            break;
        case ".html":
        default:

            break;
        }
    }

    if (!exists) {
        yield fs.mkdir(folderName);
    }

    if (page.layout) {
        page.content = contents;
        page.fullUrl = folder + cleanPageUrl;
        yield compileLayout(pages, page, page.layout, newFileName, layoutData, config, folderLocations);
    }
    return contents;
},

sortPages = function (pageObjs, pages, sortBy) {
    var i = 0,
        len,
        sortedArr = [];

    if (pages && sortBy) {
        len = pages.length;
        for (i; i < len; i++) {
            if (pageObjs[pages[i]][sortBy]) {
                sortedArr.push({ name: pages[i], value: pageObjs[pages[i]][sortBy]});
            }
        }

        sortedArr.sort(function (a, b) {
            if (a.value > b.value) return -1;
            if (a.value < b.value) return 1;
            return 0;
        });
    }

    return sortedArr;
},

compilePages = function *(pages, pageNames, folder, layoutData, count, totalPageSets, folderLocations, config) {
    var page,
        i = 0,
        len,
        exists;

    if (pageNames) {
        len = pageNames.length;

        for (i; i < len; i++) {
            page = pageNames[i];
            exists = yield fs.exists(folderLocations.preout + folder);
            if (!exists) {
                yield fs.mkdir(folderLocations.preout + folder);
            }
            exists = yield fs.exists(folderLocations.preout + folder + page);
            if (!exists && pages[page].pages) {
                yield fs.mkdir(folderLocations.preout + folder + page);
            }

            // Compile the very bottom of the stack first so that when we go up we can dynamically add the content in
            yield compilePages(pages, pages[page].pages, folder + page + "/", layoutData, count, totalPageSets, folderLocations, config);
            pages[page].sortedPages = sortPages(pages, pages[page].pages, pages[page].sortBy);

            // Now compile the current level as there will likely be a dependency
            pages[page].content = yield compilePage(pages, pages[page], folder, layoutData, folderLocations, config);

            if (folder === "/") {
                count++;
                logger.clearCompiler("  Compiling page sets: " + count + "/" + totalPageSets);
            }
        }
    }
},

compile = function *(hostname, cache) {
    var compiledFiles = [],
        result,
        config = getConfig(hostname),
        layouts = config.layouts,
        topPages = config.topPages,
        pages = config.pages,
        totalPageSets = topPages.length,
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
    yield compilePages(pages, topPages, "/", layoutData, count, totalPageSets, folderLocations, config);
    logger.info(" Done!");
};

module.exports = {
    compile: compile
}
