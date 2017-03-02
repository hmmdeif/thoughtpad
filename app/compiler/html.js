var fs = require('co-fs'),
    fsp = require('co-fs-plus'),
    path = require('path'),
    logger = require('./../logger'),
    fileWriter = require('thoughtpad-fileWriter'),
    extend = require('util')._extend;

var compileLayout = function *(thoughtpad, pageName, layout, fullContent) {
    var ext = path.extname(thoughtpad.config.layouts[layout].url).replace('.', ''),
        layoutContents = thoughtpad.config.layouts[layout].contents,
        contents,
        document;

    thoughtpad.subscribe('html-compile-complete', 'layout', function *(res) {
        contents = res.contents;
    });

    document = extend({}, thoughtpad.config.pages[pageName]);
    // If we extend then we lose the reference to the main config obj. This is beneficial as then we can pass in the compiled layout content
    // whilst preserving the raw compiled content for other pages using different layouts. Dependent layouts can then use the previously compiled
    // contents without worrying that they will overwrite the main thoughtpad config page contents object
    if (fullContent) {
        document.content = fullContent;
    }

    yield thoughtpad.notify('html-compile-request', { ext: ext, contents: layoutContents, name: layout, data: { document: document } });

    // Clean up the subscription as this function will be called for each page
    thoughtpad.unsubscribe('html-compile-complete', 'layout');

    if (thoughtpad.config.layouts[layout].dependsOn) {
        thoughtpad.config.pages[pageName].fullContent = contents;
        yield compileLayout(thoughtpad, pageName, thoughtpad.config.layouts[layout].dependsOn, contents);
    } else  {
        thoughtpad.config.pages[pageName].fullContent = contents;
    }
},

postCompilePage = function *(thoughtpad, pageName) {

    thoughtpad.subscribe("html-postcompile-complete", function *(res) {
        thoughtpad.config.pages[pageName].fullContent = res.contents;
    });

    yield thoughtpad.notify('html-postcompile-request', { contents: thoughtpad.config.pages[pageName].fullContent });

},

compilePage = function *(thoughtpad, pageName, folder) {
    var ext = path.extname(thoughtpad.config.pages[pageName].url).replace('.', ''),
        friendlyUrl = thoughtpad.config.pages[pageName].friendlyUrl || pageName,
        filepath = thoughtpad.folders.posts + thoughtpad.config.pages[pageName].url,
        newFileName = thoughtpad.folders.preout + folder + friendlyUrl + '/' + "index.html",
        contents = thoughtpad.config.pages[pageName].content;
        
    if (!contents) {
        contents = yield fs.readFile(filepath, 'utf8');

        thoughtpad.subscribe('html-compile-complete', 'page', function *(res) {
            contents = res.contents;
        });

        yield thoughtpad.notify('html-compile-request', { ext: ext, contents: contents, name: pageName, data: { document: thoughtpad.config.pages[pageName] } });

        // Clean up the subscription as this function will be called for each page
        thoughtpad.unsubscribe('html-compile-complete', 'page');
    }

    if (thoughtpad.config.pages[pageName].layout) {
        thoughtpad.config.pages[pageName].content = contents;
        thoughtpad.config.pages[pageName].fullUrl = folder + friendlyUrl + '/';
        yield compileLayout(thoughtpad, pageName, thoughtpad.config.pages[pageName].layout);

        // Run the postcompile events (usually called to minify the contents)
        yield postCompilePage(thoughtpad, pageName);
        
        if (thoughtpad.config.pages[pageName].publish) {
            logger.clearCompiler("  Writing page to file system");
            yield fileWriter.writeFile(newFileName, thoughtpad.config.pages[pageName].fullContent, "pre_out/");
        }
    
        // The index is a special case page that sits in the topmost directory
        if (thoughtpad.config.pages[pageName].index) {
            exists = yield fs.exists(thoughtpad.folders.preout + "index.html");

            if (!exists) {
                yield fileWriter.writeFile(thoughtpad.folders.preout + "index.html", thoughtpad.config.pages[pageName].fullContent, "pre_out/");
            }
        }
    }
    return contents;
},

getLayoutData = function *(layouts, thoughtpad, dependsOn, layoutData) {
    var layout,
        contents,
        layoutData;

    if (!layoutData) {
        layoutData = {};
    }

    if (layouts) {
        for (layout in layouts) {
            contents = yield fs.readFile(thoughtpad.folders.layouts + layouts[layout].url, 'utf8');
            layoutData[layout] = { contents: contents, url: layouts[layout].url, dependsOn: dependsOn };
            if (layouts[layout].layouts) {
                layoutData = yield getLayoutData(layouts[layout].layouts, thoughtpad, layout, layoutData);
            }
        }
    }

    return layoutData;
},

sortPages = function (pages, pageName) {
    var i = 0,
        len,
        sortBy = pages[pageName].sortBy,
        order = (pages[pageName].sortOrder && pages[pageName].sortOrder === "asc") ? [1, -1] : [-1, 1],
        page = pages[pageName],
        sortedArr = [];

    if (page.pages && sortBy) {
        len = page.pages.length;
        for (i; i < len; i++) {
            if (pages[page.pages[i]][sortBy] && pages[page.pages[i]].publish) {
                sortedArr.push({ name: page.pages[i], value: pages[page.pages[i]][sortBy] });
            }
        }

        // By default the sort order is desc (so latest posts appear at the top)
        sortedArr.sort(function (a, b) {
            if (a.value > b.value) return order[0];
            if (a.value < b.value) return order[1];
            return 0;
        });
    }

    return sortedArr;
},

compilePages = function *(thoughtpad, pages, folder) {
    var i = 0,
        newFolder,
        len;

    if (!folder) {
        pages = thoughtpad.config.topPages || [];
        folder = thoughtpad.config.startFolder;
    }

    if (pages) {
        len = pages.length;
        for (i; i < len; i++) {
            // Compile the very bottom of the stack first so that when we go up we can dynamically add the content in
            if (thoughtpad.config.pages[pages[i]].ignoreBlockInUrl) {
                newFolder = folder;
            } else if (thoughtpad.config.pages[pages[i]].friendlyUrl) {
                newFolder = folder + thoughtpad.config.pages[pages[i]].friendlyUrl + '/';
            } else {
                newFolder = folder + pages[i] + '/';
            }
            yield compilePages(thoughtpad, thoughtpad.config.pages[pages[i]].pages, newFolder);

            // Sort the pages into the order specified by the config
            logger.clearCompiler("  Ordering the html pages");
            thoughtpad.config.pages[pages[i]].sortedPages = sortPages(thoughtpad.config.pages, pages[i]);

            // Now compile the current level as there will likely be a dependency, but only if we haven't compiled it already
            if (!thoughtpad.config.pages[pages[i]].fullUrl) {
                thoughtpad.config.pages[pages[i]].content = yield compilePage(thoughtpad, pages[i], folder);
            }
        }
    }
},

compile = function *(thoughtpad) {

    logger.compiler("\n  Reading layout data");

    // First save the layout data to memory (saves file io when compiling each page and it is unlikely to have many layouts)
    thoughtpad.config.layouts = yield getLayoutData(thoughtpad.config.layouts, thoughtpad);

    logger.clearCompiler("  Handling precompilation for html pages");
    yield thoughtpad.notify('html-precompile-all-request');

    // Compile each page in turn
    thoughtpad.subscribe('html-compile-all-request', function *(res) {
        yield compilePages(res.thoughtpad);
    });

    yield compilePages(thoughtpad);

    logger.clearCompiler("  Handling postcompilation for html pages");
    yield thoughtpad.notify('html-postcompile-all-request');

    logger.info(" Done!");
};

module.exports = {
    compile: compile
}
