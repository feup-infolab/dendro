const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DataStoreConnection = require(Pathfinder.absPathInSrcFolder("/kb/datastore/datastore_connection.js")).DataStoreConnection;

const clearDataStore = function (app, callback)
{
    if (Config.startup.load_databases && Config.startup.destroy_datastore)
    {
        DataStoreConnection.deleteAllDataOfAllResources(function (err, result)
        {
            if (!err)
            {
                Logger.log_boot_message("info", "Datastore cleared successfully.");
            }

            callback(err);
        });
    }
    else
    {
        Logger.log_boot_message("info", "Datastore is not set to be cleared. Continuing...");
        return callback(null);
    }
};

module.exports.clearDataStore = clearDataStore;
