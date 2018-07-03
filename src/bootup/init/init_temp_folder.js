const fs = require("fs");
const async = require("async");
const mkdirp = require("mkdirp");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

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
                rimraf(Config.tempFilesDir, function (err)
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
