var path = require('path');
var async = require('async');

var PluginConfig = require("./config.json");
var Config = require(path.join(path.dirname(require.main.filename), "models", "meta", "config.js")).Config;
var PluginManager = require(path.join(Config.getAbsolutePathToPluginsFolder(), "plugin_manager.js")).PluginManager;
var DendroInteraction2CSV = require(path.join(Config.getAbsolutePathToPluginsFolder(), PluginConfig.plugin_folder_name, "dendro_interaction2csv.js")).DendroInteraction2CSV;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroInteraction2CSV.setup(app);
};

module.exports.Setup = Setup;