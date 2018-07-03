const fs = require("fs");
const mkdirp = require("mkdirp");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const initTempUploadsFolder = function (app, callback)
{
    let fs = require("fs");

    // create temporary uploads folder if not exists
    let tempUploadsFolder = Config.tempUploadsDir;

    try
    {
        fs.statSync(tempUploadsFolder).isDirectory();
    }
    catch (e)
    {
        Logger.log_boot_message("Temp folder for uploads " + tempUploadsFolder + " does not exist. Creating...");
        try
        {
            mkdirp.sync(tempUploadsFolder);
            Logger.log_boot_message("Temp folder for uploads " + tempUploadsFolder + " created.");
        }
        catch (e)
        {
            return callback("[FATAL] Unable to create Temp folder for uploads at " + tempUploadsFolder + "\n Error : " + JSON.stringify(e));
        }
    }

    callback(null);
};

module.exports.initTempUploadsFolder = initTempUploadsFolder;
