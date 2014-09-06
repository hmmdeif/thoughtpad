module.exports = {
    mode: 'development',
    development: {
        port: 3000,
        bundleJs: false,
        bundleCss: false
    },
    production: {
        port: 3000,
        bundleJs: true,
        bundleCss: true
    }
}
