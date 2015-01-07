var should = require('should'),
    app = require('./../app/compiler/stylesheet'),
    man = require('./../app/compiler/pluginRegister'),
    co = require('co'),
    fs = require('co-fs'),
    path = require('path'),
    config = require('./start/example-config'),
    fileWriter = require('thoughtpad-fileWriter'),
    folders = {
        preoutScripts: path.normalize(__dirname + "/pre_out/"),
        scripts: path.normalize(__dirname + "/start/inner/"),
        stylesheets: path.normalize(__dirname + "/start/inner/"),
        preoutStylesheets: path.normalize(__dirname + "/pre_out/"),
    };

describe("stylesheet compiler", function () {
    it("should call the css pre-compile event", function (done) {
        var thoughtpad,
            result = "",
            result2 = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("css-precompile-request", function *(res) {
            result = "called";
            yield thoughtpad.notify('css-precompile-complete', {name: 'hello', contents: 'hello', ext: 'rr'})
        });

        thoughtpad.subscribe("css-compile-request", function *(res) {
            if (res.ext === "rr") {
                result2 = res.contents;
            }            
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql('called');
            result2.should.eql('hello');
            done();
        })();
    });

    it("should call the css compile event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("css-compile-request", function *(res) {
            if (res.ext === "css") {
                result = res.contents;
            }            
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql('bar');
            done();
        })();
    });

    it("should call the css post-compile event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("css-postcompile-request", function *(res) {
            if (res.name === "bar") {
                result = res.contents;
                yield thoughtpad.notify('css-postcompile-complete', {name: 'bar', contents: result});
            }
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql('bar');
            done();
        })();
    });

    it("should call the css pre-output event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("css-preoutput-request", function *(res) {
            result = res.contents;
            yield thoughtpad.notify('css-preoutput-complete', {bundles: {bar: 'bar'}});
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql({bar:'bar'});
            done();
        })();
    });

    it("should write all css files to pre_out folder", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result = yield fs.readFile('./test/pre_out/bar.css', 'utf8');
            result.should.eql('bar');
            done();
        })();
    });

});