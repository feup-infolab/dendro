const fs = require("fs");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const GridFSConnection = rlequire("dendro", "src/kb/gridfs.js").GridFSConnection;

const clearFilesStorage = function (app, callback)
{
    if (Config.startup.load_databases && Config.startup.destroy_files_store)
    {
        Config.gfs.default.connection.deleteByQuery({}, function (err, result)
        {
            if (!err)
            {
                Logger.log_boot_message("Files storage cleared successfully.");
            }

            callback(err);
        });
    }
    else
    {
        Logger.log_boot_message("Files storage is not set to be cleared. Continuing...");
        return callback(null);
    }
};

module.exports.clearFilesStorage = clearFilesStorage;
