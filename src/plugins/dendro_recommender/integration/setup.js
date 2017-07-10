const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;

var PluginConfig = require("./config.json");

var DendroRecommender = require(Pathfinder.absPathInPluginsFolder(path.join(PluginConfig.plugin_folder_name, "dendro_recommender.js"))).DendroRecommender;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroRecommender.setup(app);
};

module.exports.Setup = Setup;