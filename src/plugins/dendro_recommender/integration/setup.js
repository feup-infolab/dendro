var path = require('path');
var async = require('async');

var PluginConfig = require("./config.json");
const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
var DendroRecommender = require(Config.absPathInPluginsFolder(path.join(PluginConfig.plugin_folder_name, "dendro_recommender.js"))).DendroRecommender;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroRecommender.setup(app);
};

module.exports.Setup = Setup;