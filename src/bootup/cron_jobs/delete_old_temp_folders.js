var CronJob = require('cron').CronJob;
const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const tmpLocation = Pathfinder.absPathInApp("temp");
const exec = require("child_process").exec;

const deleteOldTempFolders = function (app, callback)
{
    console.log("temp: " + tmpLocation);
    const deleteTempFoldersOlderThen1Day = function (callback) {
        //resources older than one hour
        let result = null;
        callback(null, result);
    };
    try {
        let job = new CronJob('* * * * * *', function() {
            deleteTempFoldersOlderThen1Day(function (err, result) {
                Logger.log("info", "Deleted: " + JSON.stringify(result));
            });
        }, null, true, 'America/Los_Angeles');
        job.start();
        callback(null, null);
    } catch(ex) {
        const errorMsg = "Invalid job pattern: " + ex.toString();
        Logger.log("error", errorMsg);
        callback(true, errorMsg);
    }
};

module.exports.deleteOldTempFolders = deleteOldTempFolders;