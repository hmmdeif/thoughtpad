var fs = require('co-fs');

var copyFile = function *(file, data) {
    var realPart = file.replace(/\\/g, "/").split('out/')[0],
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
};

module.exports = {
    copyFile: copyFile
}