var should = require('should'),
    app = require('./../app/compiler/javascript'),
    man = require('./../app/compiler/pluginRegister'),
    co = require('co'),
    fs = require('co-fs'),
    path = require('path'),
    config = require('./start/example-config'),
    fileWriter = require('thoughtpad-fileWriter'),
    folders = {
        preoutScripts: path.normalize(__dirname + "/pre_out/"),
        scripts: path.normalize(__dirname + "/start/inner/")
    };

describe("javascript compiler", function () {
    it("should call the javascript pre-compile event", function (done) {
        var thoughtpad,
            result = "",
            result2 = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("javascript-precompile-request", function *(res) {
            result = "called";
            yield thoughtpad.notify('javascript-precompile-complete', {name: 'hello', contents: 'hello', ext: 'rr'})
        });

        thoughtpad.subscribe("javascript-compile-request", function *(res) {
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
        });
    });

    it("should call the javascript compile event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("javascript-compile-request", function *(res) {
            if (res.ext === "js") {
                result = res.contents;
            }            
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql('foo');
            done();
        });
    });

    it("should call the javascript post-compile event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;
        thoughtpad.config.startFolder = '/';

        thoughtpad.subscribe("javascript-postcompile-request", function *(res) {
            result = res.contents;
            yield thoughtpad.notify('javascript-postcompile-complete', {name: 'foo', contents: result});
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql('foo');
            done();
        });
    });

    it("should call the javascript pre-output event", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe("javascript-preoutput-request", function *(res) {
            result = res.contents;
            yield thoughtpad.notify('javascript-preoutput-complete', {bundles: {foo: 'foo'}});
        });

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result.should.eql({foo:'foo'});
            done();
        });
    });

    it("should write all javascript files to pre_out folder", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        co(function *() {
            yield fileWriter.remakeDirectory('./test/pre_out/');
            yield app.compile(thoughtpad, {});
            result = yield fs.readFile('./test/pre_out/foo.js', 'utf8');
            result.should.eql('foo');
            done();
        });
    });

});