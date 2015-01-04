module.exports = {
    site: {
        author: "thoughtpad",
        email: "someone@example.com",
        description: "A new thoughtpad site"
    },
    func: {
        getPreparedDescription: function (docDesc, siteDesc) {
            return docDesc || siteDesc;
        },
        getYear: function () {
            var x = new Date();
            return x.getFullYear();
        },
        getStylesheets: function (cssBundle) {
            var i = 0,
                len = cssBundle.length,
                ret = "";

            for (i; i < len; i++) {
                ret += "<link href='/styles/" + cssBundle[i] + ".css' rel='stylesheet' />";
            }

            return ret;
        },
        getScripts: function (jsBundle) {
            var i = 0,
                len = jsBundle.length,
                ret = "";

            for (i; i < len; i++) {
                ret += "<script src='/scripts/" + jsBundle[i] + ".js'></script>";
            }

            return ret;
        }
    },
    startFolder: '/'
};