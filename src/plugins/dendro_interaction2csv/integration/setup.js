const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

var PluginConfig = require("./config.json");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
var DendroInteraction2CSV = require(Pathfinder.absPathInPluginsFolder(path.join(PluginConfig.plugin_folder_name, "dendro_interaction2csv.js"))).DendroInteraction2CSV;

function Setup ()
{

}

Setup.registerRoutes = function(app)
{
    return DendroInteraction2CSV.setup(app);
};

module.exports.Setup = Setup;