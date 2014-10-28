module.exports = {
    scriptCollections: {

    },
    cssCollections: {

    },
    templateData: {
        site: {
            author: "David Fisher-Moreau",
            email: "deiform87@gmail.com",
            description: "Test site"
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
                    len,
                    parts,
                    ext,
                    ret = "";

                if (typeof cssBundle === "string") {
                    ret = "<link href='" + cssBundle + ".css' rel='stylesheet' />";
                } else {
                    len = cssBundle.length;
                    for (i; i < len; i++) {
                        parts = cssBundle[i].split(".");
                        ext = parts[parts.length - 1];
                        switch (ext) {
                        case "styl":
                            cssBundle[i] = cssBundle.replace(".styl", "");
                            break;
                        case "css":
                        default:
                            break;
                        }

                        ret += "<link href='" + cssBundle[i] + "' rel='stylesheet' />";
                    }
                }
                return ret;
            },
            getScripts: function (scriptBundle) {
                var i = 0,
                    len,
                    parts,
                    ext,
                    ret = "";

                if (typeof scriptBundle === "string") {
                    ret = "<script src='" + scriptBundle + ".js'></script>";
                } else {
                    len = scriptBundle.length;
                    for (i; i < len; i++) {
                        parts = scriptBundle[i].split(".");
                        ext = parts[parts.length - 1];
                        switch (ext) {
                        case "coffee":
                            scriptBundle[i] = scriptBundle.replace(".coffee", "");
                            break;
                        case "js":
                        default:
                            break;
                        }

                        ret += "<script src='" + scriptBundle[i] + "'></script>";
                    }
                }
                return ret;
            }
        }
    },
    tags: {

    },
    topPages: [],
    pages: {

    },
    layouts: {

    }
}