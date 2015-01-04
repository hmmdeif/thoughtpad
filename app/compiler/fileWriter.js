var fs = require('co-fs'),
    fsp = require('co-fs-plus');

var removeDirectory = function *(folder) {
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
},

remakeDirectory = function *(folder) {
    if (yield fs.exists(folder)) {
        yield removeDirectory(folder);
    }

    yield fs.mkdir(folder);
},

writeFile = function *(file, data, splitPart) {
    if (!splitPart) {
        splitPart = "out/";
    }

    var realPart = file.replace(/\\/g, "/").split(splitPart)[0],
        realFile = yield fs.realpath(realPart)
        file = file.replace(realPart, realFile + "/").replace(/\\/g, "/"),
        folders = file.split('/'),
        i = 0,
        currentFolder = "",
        exists = false,
        separator = "",
        len = folders.length - 1; // we don't want the last part of the path as that's the filename

    // Make the directory structure for the files to sit in before copying the file
    for (i; i < len; i++) {
        currentFolder += separator + folders[i];
        exists = yield fs.exists(currentFolder);
        if (!exists && currentFolder !== "") {
            yield fs.mkdir(currentFolder);
        }
        separator = "/";
    }
    yield fs.writeFile(file, data);
},

copyDirectory = function *(startLocation, endLocation) {
    var startFiles = yield fsp.readdir(startLocation, null, []),
        i = 0,
        file,
        len = startFiles.length,
        fileName;

    for (i; i < len; i++) {
        file = yield fs.readFile(startFiles[i]);
        fileName = startFiles[i].replace(/\\/g, "/").replace(startLocation.replace('./', ''), "");
        yield writeFile(endLocation + '/' + fileName, file);
    }
};

module.exports = {
    writeFile: writeFile,
    copyDirectory: copyDirectory,
    remakeDirectory: remakeDirectory
}