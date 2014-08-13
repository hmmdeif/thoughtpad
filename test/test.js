var app = require('./../app/app'),
    http = require('http'),
    should = require('should'),
    compiler = require('./../app/compiler/compiler'),
    config = require('./../app/config'),
    url = "http://test-domain:" + config[config.mode].port,
    co = require('co');

describe('compiler', function () {
    before(function (done) {
        co(function *() {
            yield compiler.compile({}, 'test-domain');
            done();
        })();

    });

    it('should have produced a file', function (done) {
        var req = http.get(url, function (res) {
            res.should.have.status(404);

            done();
        });
    });
});