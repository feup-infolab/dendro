var path = require('path');
var async = require('async');

var PluginConfig = require("./config.json");
var Config = function() { return GLOBAL.Config; }();
var PluginManager = require(path.join(Config.getAbsolutePathToPluginsFolder(), "plugin_manager.js")).PluginManager;
var DendroRecommender = require(path.join(Config.getAbsolutePathToPluginsFolder(), PluginConfig.plugin_folder_name, "dendro_recommender.js")).DendroRecommender;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroRecommender.setup(app);
};

module.exports.Setup = Setup;