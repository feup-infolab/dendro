const fs = require('fs');
const mkdirp = require('mkdirp');

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const Logger = require(Pathfinder.absPathInSrcFolder('utils/logger.js')).Logger;

const initTempUploadsFolder = function (app, callback)
{
    let fs = require('fs');
    let registeredUncaughtExceptionHandler;

    // create temporary uploads folder if not exists
    let tempUploadsFolder = Config.tempUploadsDir;

    try
    {
        fs.statSync(tempUploadsFolder).isDirectory();
    }
    catch (e)
    {
        Logger.log_boot_message('info', 'Temp folder for uploads ' + tempUploadsFolder + ' does not exist. Creating...');
        try
        {
            mkdirp.sync(tempUploadsFolder);
            Logger.log_boot_message('success', 'Temp folder for uploads ' + tempUploadsFolder + ' created.');
        }
        catch (e)
        {
            return callback('[FATAL] Unable to create Temp folder for uploads at ' + tempUploadsFolder + '\n Error : ' + JSON.stringify(e));
        }
    }

    callback(null);
};

module.exports.initTempUploadsFolder = initTempUploadsFolder;
