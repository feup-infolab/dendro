const fs = require("fs");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const DataStoreConnection = rlequire("dendro", "src/kb/datastore/datastore_connection.js").DataStoreConnection;

const clearDataStore = function (app, callback)
{
    if (Config.startup.load_databases && Config.startup.destroy_datastore)
    {
        DataStoreConnection.deleteAllDataOfAllResources(function (err, result)
        {
            if (!err)
            {
                Logger.log_boot_message("Datastore cleared successfully.");
            }

            callback(err);
        });
    }
    else
    {
        Logger.log_boot_message("Datastore is not set to be cleared. Continuing...");
        return callback(null);
    }
};

module.exports.clearDataStore = clearDataStore;
