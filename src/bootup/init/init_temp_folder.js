const fs = require("fs");
const async = require("async");
const mkdirp = require("mkdirp");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const initTempFilesFolder = function (app, callback)
{
    Logger.log_boot_message("Setting up temporary files directory at " + Config.tempFilesDir);
    async.waterfall([
        function (cb)
        {
            if (Config.debug.files.delete_temp_folder_on_startup)
            {
                Logger.log_boot_message("Deleting temp files dir at " + Config.tempFilesDir);
                const rimraf = require("rimraf");
                rimraf.remove(Config.tempFilesDir, function (err)
                {
                    if (isNull(err))
                    {
                        Logger.log_boot_message("Deleted temp files dir at " + Config.tempFilesDir);
                    }
                    else
                    {
                        Logger.log("[ERROR] Unable to delete temp files dir at " + Config.tempFilesDir);
                    }

                    cb(err);
                });
            }
            else
            {
                cb(null);
            }
        },
        function (cb)
        {
            mkdirp.sync(Config.tempFilesDir);
            Logger.log_boot_message("Temporary files directory successfully created at " + Config.tempFilesDir);
            cb();
        }
    ], function (err)
    {
        if (isNull(err))
        {
            Logger.log_boot_message("Temporary files directory successfully set up at " + Config.tempFilesDir);
            return callback(null);
        }
        return callback("[ERROR] Unable to set up files directory at " + Config.tempFilesDir);
    });
};

module.exports.initTempFilesFolder = initTempFilesFolder;
