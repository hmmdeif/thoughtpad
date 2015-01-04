var should = require('should'),
    app = require('./../app/compiler/pluginRegister'),
    co = require('co'),
    config = require('./start/example-config');


describe("plugin register", function () {
    it("should register all modules in production mode", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = app.initModules(config, 'production');

        thoughtpad.subscribe("css-preoutput-complete", function *(contents) {
            result = contents.bundles;
        });

        co(function *() {
            yield thoughtpad.notify("css-preoutput-request", { contents: { a: ".class1 {\n\twidth: 100%;\n}", b: ".class1 {\n\twidth: 100%;\n}", c: ".class1 {\n\twidth: 100%;\n}", d: ".class1 {\n\twidth: 100%;\n}", e: ".class1 {\n\twidth: 100%;\n}"} });
            result.should.eql({ one: '.class1{width:100%}.class1{width:100%}', two: '.class1{width:100%}.class1{width:100%}.class1{width:100%}'});
            done();
        })();
    });

    it("should register all modules in development mode", function (done) {
        var thoughtpad,
            result = "";

        thoughtpad = app.initModules(config, 'development');

        thoughtpad.subscribe("html-compile-complete", function *(res) {
            result = res.contents;
        });

        co(function *() {            
            yield thoughtpad.notify("html-compile-request", { ext: "coffee", contents: "div '.content', ->\n\ttext @document.content", data: { document: { content: "hello there" } } });
            result.should.equal('<div class="content">hello there</div>');
            done();
        })();
    }); 
});