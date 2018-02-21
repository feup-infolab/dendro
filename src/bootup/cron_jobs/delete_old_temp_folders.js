var CronJob = require('cron').CronJob;
const Pathfinder = global.Pathfinder;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const tmpLocation = Config.tempFilesDir;
const exec = require("child_process").exec;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const fs = require("fs");

const deleteOldTempFolders = function (app, callback)
{
    Logger.log("info", "Temp folder location is: " + tmpLocation);
    const deleteTempFoldersOlderThen1Day = function (cb) {
        //resources older than two hour
        let resourcesToDelete = null;
        //deletes resources older than two hours inside the temp folder
        //find /Users/nelsonpereira/Desktop/infolaRepos/dendroRepo/dendro/temp/ -not -newermt '-7200 seconds' -mindepth 1 -delete
        //TODO look for a way to do this using nodejs code only -> so that it runs on machines other than macOs and Ubunto
        if (fs.existsSync(tmpLocation)) {
            InformationElement.isSafePath(tmpLocation, function (err, isSafe) {
                if (!err && isSafe) {
                    exec("find " + tmpLocation + " -not -newermt '-7200 seconds' -mindepth 1", function (err, stdout, stderr) {
                        if (!isNull(err)) {
                            const errorMsg = "Error finding old resources in the delete_old_temp_folders job: " + err;
                            cb(true, errorMsg);
                        }
                        else {
                            resourcesToDelete = stdout;
                            exec("find " + tmpLocation + " -not -newermt '-7200 seconds' -mindepth 1 -delete", function (err, stdout, stderr) {
                                if (!isNull(err)) {
                                    const errorMsg = "Error executing the delete_old_temp_folders job: " + err;
                                    cb(true, errorMsg);
                                }
                                else {
                                    const msg = "Executed the delete_old_temp_folders job successfully, deleted: " + resourcesToDelete;
                                    cb(null, msg);
                                }
                            });
                        }
                    });
                }
                else
                {
                    const errorMsg = "Error executing the delete_old_temp_folders job: " + "Location " + tmpLocation + " is not a safe path to delete";
                    cb(true, errorMsg);
                }
            });
        }
        else
        {
            const errorMsg = "Error executing the delete_old_temp_folders job: " + "Temp folder location does not exist, did you accidentally deleted it?";
            cb(true, errorMsg);
        }
    };
    try {
        //Every hour
        let job = new CronJob("0 * * * *", function() {
            deleteTempFoldersOlderThen1Day(function (err, result) {
                if(!isNull(err))
                {
                    Logger.log("error", result);
                }
                else
                {
                    Logger.log("info", result);
                }
            });
        }, null, true, 'America/Los_Angeles');
        job.start();
        const jobMsg = "Hourly delete_old_temp_folders job started";
        Logger.log("info", jobMsg);
        callback(null, null);
    } catch(ex) {
        const errMsg = "Invalid delete_old_temp_folders job pattern: " + ex.toString();
        Logger.log("error", errMsg);
        callback(true, errMsg);
    }
};

module.exports.deleteOldTempFolders = deleteOldTempFolders;