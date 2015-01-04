var manager = require('thoughtpad-plugin-manager');

var initModules = function (config, mode) {
	var i = 0,
		len = config.modules[mode].length,
		modules = [];

	for (i; i < len; i++) {
		modules.push(require('thoughtpad-plugin-' + config.modules[mode][i]));
	}

	return manager.registerPlugins(modules, config);
};

module.exports = {
	initModules: initModules
}