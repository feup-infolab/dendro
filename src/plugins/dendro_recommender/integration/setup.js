var path = require('path');
var async = require('async');

var PluginConfig = require("./config.json");
var Config = function() { return GLOBAL.Config; }();
var DendroRecommender = require(Config.absPathInPluginsFolder(path.join(PluginConfig.plugin_folder_name, "dendro_recommender.js"))).DendroRecommender;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroRecommender.setup(app);
};

module.exports.Setup = Setup;