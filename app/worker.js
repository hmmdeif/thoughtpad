var compiler = require('./compiler/compiler'),
    co = require('co');

process.on('message', function (hostname) {
    setTimeout(function () {
        process.send({ success: false });
        process.exit();
    }, 30000)
    
    co(function *() {               
        var ret = yield compiler.compile('production', hostname);
        process.send(ret);
        process.exit();
    });
});


