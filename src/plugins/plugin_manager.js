const fs = require("fs");
const path = require("path");
const _ = require("underscore");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

function PluginManager ()
{
}

PluginManager.registerPlugins = function (app, callback)
{
    const pluginsFolderAbsPath = Pathfinder.getAbsolutePathToPluginsFolder();

    const isHiddenFile = function (fileName)
    {
        for (let i = 0; i < Config.systemOrHiddenFilesRegexes.length; i++)
        {
            let regex = new RegExp(Config.systemOrHiddenFilesRegexes[i]);

            if (fileName.match(regex))
            {
                return true;
            }
        }

        return false;
    };

    let files = fs.readdirSync(pluginsFolderAbsPath);

    files = _.without(files, "conf");

    for (let i = 0; i < files.length; i++)
    {
        let fileName = files[i];

        if (!isHiddenFile(fileName))
        {
            const pluginAbsolutePath = path.join(pluginsFolderAbsPath, fileName);

            let stats = fs.statSync(pluginAbsolutePath);

            if (stats.isDirectory())
            {
                let configFileLocation = pluginAbsolutePath + "/integration/config.json";
                let PluginConfig = require(configFileLocation);

                let setupFileLocation = pluginAbsolutePath + "/integration/setup.js";
                let PluginSetup = require(setupFileLocation).Setup;

                Logger.log("Registering routes for plugin " + PluginConfig.name);
                app = PluginSetup.registerRoutes(app);
            }
        }
    }

    callback(null, app);
};

module.exports.PluginManager = PluginManager;
