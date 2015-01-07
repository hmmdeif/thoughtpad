var should = require('should'),
    app = require('./../app/compiler/html'),
    man = require('./../app/compiler/pluginRegister'),
    co = require('co'),
    fs = require('co-fs'),
    path = require('path'),
    config = require('./start/example-config'),
    extend = require('util')._extend,
    fileWriter = require('thoughtpad-fileWriter'),
    folders = {
        layouts: path.normalize(__dirname + '/layouts/'),
        posts: path.normalize(__dirname + "/posts/"),
        preout: path.normalize(__dirname + "/pre_out/")
    };

describe("html compiler", function () {
    it("should grab the layout data and store the dependencies correctly", function (done) {
        var thoughtpad;

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        co(function *() {
            yield app.compile(thoughtpad, {});
            thoughtpad.config.layouts.foo.contents.should.eql('foo');
            thoughtpad.config.layouts.too.contents.should.eql('too');
            thoughtpad.config.layouts.bar.contents.should.eql('bar');
            thoughtpad.config.layouts.bar.dependsOn.should.eql('foo');
            (thoughtpad.config.layouts.foo.dependsOn === undefined).should.be.true;
            done();
        })();
    });

    it("should call the precompile event for all pages", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe('html-precompile-all-request', function *(res) {
            result = "ok";
        });

        co(function *() {
            yield app.compile(thoughtpad, {});
            result.should.eql('ok');
            done();
        })();
    });

    it("should call the postcompile event for all pages", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        thoughtpad.subscribe('html-postcompile-all-request', function *(res) {
            result = "ok";
        });

        co(function *() {
            yield app.compile(thoughtpad, {});
            result.should.eql('ok');
            done();
        })();
    });

    it("should sort dependent pages correctly", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;

        co(function *() {
            yield app.compile(thoughtpad, {});
            thoughtpad.config.pages.home.sortedPages[0].name.should.eql('two');
            thoughtpad.config.pages.home.sortedPages[1].name.should.eql('one');
            done();
        })();
    });

    it("should call the compile event for all pages", function (done) {
        var thoughtpad,
            result = "";

        delete require.cache[path.normalize(__dirname + '/start/example-config.js')];
        
        config = require('./start/example-config')
        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;
        thoughtpad.config.startFolder = '/';
        thoughtpad.config.pages.two.fullUrl = null;

        thoughtpad.subscribe('html-compile-request', function *(res) {
            result = "ok";
        });

        co(function *() {
            yield app.compile(thoughtpad, {});
            thoughtpad.config.pages.one.content.should.eql('one');
            thoughtpad.config.pages.home.content.should.eql('home');
            result.should.eql('ok');
            result = yield fs.exists(folders.preout + "home/two/index.html");
            result.should.be.true;
            done();
        })();
    });

    it("should call the postcompile event for all pages", function (done) {
        var thoughtpad,
            result = "";

        delete require.cache[path.normalize(__dirname + '/start/example-config.js')];
        
        config = require('./start/example-config')
        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;
        thoughtpad.config.startFolder = '/';
        thoughtpad.config.pages.two.fullUrl = null;

        thoughtpad.subscribe('html-postcompile-request', function *(res) {
            result = "ok";
        });

        co(function *() {
            yield app.compile(thoughtpad, {});
            result.should.eql('ok');
            done();
        })();
    });

    it("should not compile pages if fullUrl exists on page object", function (done) {
        var thoughtpad,
            result = "";

        delete require.cache[path.normalize(__dirname + '/start/example-config.js')];
        
        config = require('./start/example-config')
        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;
        thoughtpad.config.startFolder = '/';
        thoughtpad.config.pages.two.fullUrl = 'something';

        thoughtpad.subscribe('html-postcompile-request', function *(res) {
            result = "ok";
        });

        co(function *() {
            yield app.compile(thoughtpad, {});
            result.should.eql('');
            done();
        })();
    });

    it("should place the index file correctly", function (done) {
        var thoughtpad,
            result = "";

        delete require.cache[path.normalize(__dirname + '/start/example-config.js')];
        
        config = require('./start/example-config')
        thoughtpad = man.initModules(config, 'test');
        thoughtpad.folders = folders;
        thoughtpad.config.startFolder = '/';        

        co(function *() {
            yield app.compile(thoughtpad, {});
            result = yield fs.exists(folders.preout + "index.html");
            result.should.be.true;
            done();
        })();
    });

});