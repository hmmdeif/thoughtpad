var coffee = require('coffeekup'),
    fs = require('co-fs'),
    co = require('co'),
    uglify = require('uglify-js'),
    markdown = require('markdown').markdown,
    _hostname,
    _preout,
    _layouts = [],
    _layoutFolder,
    _postFolder,
    config;

var getLayouts = function (hostname) {
    config = require(hostname + "\\config.js");
    return config.layouts;
},

getPages = function (hostname) {
    config = require(hostname + "\\config.js");
    return config.pages;
},

compileLayout = function *(layout) {
    var parts = layout.url.split("."),
        ext = parts[parts.length - 1],
        filepath = _layoutFolder + layout.url,
        contents;

    switch (ext) {
    case "coffee":
        contents = yield fs.readFile(filepath, 'utf8');
        _layouts.push(coffee.render(contents));
        break;
    case "html":
    default:

        break;
    }

},

compileLayouts = function *(layouts) {
    var layout;

    if (layouts) {
        for (layout in layouts) {
            yield compileLayout(layouts[layout]);
            yield compileLayouts(layout.layouts);
        }
    }
    return;
},

compilePage = function *(page, folder) {
    var parts = page.url.split("."),
        ext = parts[parts.length - 1],
        filepath = _postFolder + page.url,
        newFileName = _preout + folder + page.url.replace("." + ext, ""),
        contents;

    switch (ext) {
    case "md":
        contents = yield fs.readFile(filepath, 'utf8');
        contents = markdown.toHTML(contents);
        yield fs.writeFile(newFileName, contents);
        break;
    case "html":
    default:

        break;
    }
    return;
},

compilePages = function *(pages, folder) {
    var page,
        exists;

    if (pages) {
        for (page in pages) {
            exists = yield fs.exists(_preout + folder);
            if (!exists) {
                yield fs.mkdir(_preout + folder);
            }
            exists = yield fs.exists(_preout + folder + page);
            if (!exists && pages[page].pages) {
                yield fs.mkdir(_preout + folder + page);
            }

            // Compile the very bottom of the stack first so that when we go up we can dynamically add the content in
            yield compilePages(pages[page].pages, folder + "\\" + page + "\\");

            // Now compile the current level as there will likely be a dependency
            yield compilePage(pages[page], folder);
        }
    }
    return;
};

compile = function *(hostname, cache) {
    var compiledFiles = [],
        result,
        layouts = getLayouts(hostname),
        pages = getPages(hostname),
        i,
        len,
        files,
        bundle;

    _layoutFolder = hostname + "\\layouts\\";
    _postFolder = hostname + "\\documents\\posts\\";
    _hostname = hostname + "\\documents\\";
    _preout = hostname + "\\pre_out\\";

    yield compilePages(pages, "");
    //yield compileLayouts(layouts);
}

module.exports = {
    compile: compile
}