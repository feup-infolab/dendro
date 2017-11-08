const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;

const clearFilesStorage = function (app, callback)
{
    if (Config.startup.load_databases && Config.startup.destroy_datastore)
    {
        Config.gfs.default.connection.deleteByQuery({}, function (err, result)
        {
            if (!err)
            {
                Logger.log_boot_message("info", "Files storage cleared successfully.");
            }

            callback(err);
        });
    }
    else
    {
        Logger.log_boot_message("info", "Files storage is not set to be cleared. Continuing...");
        return callback(null);
    }
};

module.exports.clearFilesStorage = clearFilesStorage;
