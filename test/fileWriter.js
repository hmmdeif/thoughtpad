var should = require('should'),
    app = require('./../app/compiler/fileWriter'),
    co = require('co'),
    fs = require('co-fs'),
    fsp = require('co-fs-plus');


describe("file writer", function () {
    it("should write a file to the out directory", function (done) {
        var data;

        co(function *() {
            yield app.writeFile('./test/out/file1', 'test');
            data = yield fs.readFile('./test/out/file1', 'utf8');
            data.should.equal('test');
            yield fs.unlink('./test/out/file1');
            done();
        })();
    });

    it("should copy directory with correct structure", function (done) {
        var data;

        co(function *() {
            yield app.copyDirectory('./test/start/', './test/out/end/');
            data = yield fs.readFile('./test/out/end/file1', 'utf8');
            data.should.equal('test');
            data = yield fs.readFile('./test/out/end/inner/file2', 'utf8');
            data.should.equal('foo');
            yield app.remakeDirectory('./test/out/end/');
            done();
        })();
    });

    it("should clean a directory tree and remake the top level", function (done) {
        var files;

        co(function *() {
            yield app.copyDirectory('./test/start/', './test/out/end/');

            yield app.remakeDirectory('./test/out/end/');
            files = yield fs.readdir('./test/out/end/')
            files.length.should.equal(0);
            done();
        })();
    });
});