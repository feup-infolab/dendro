const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

module.exports.init = function (callback) {
    Logger.log("info", "Attempting to restart any test job remaining in mongodb");
    Config.agenda.jobs({name: "test job"}, function(err, jobs) {
        if(!isNull(jobs) && jobs.length > 0)
        {
            let errorMessages = [];
            jobs.forEach(function (job) {
                Logger.log("info", "Will attempt to run test job");
                job.attrs.lockedAt = null;
                job.schedule(new Date());
                job.save();
            });
            let message = "There are " + jobs.length + " of type test job that will attempt running again!";
            callback(null, message);
        }
        else
        {
            const msg = "No test jobs in mongodb to attempt running again!";
            Logger.log("info", msg);
            callback(null, msg);
        }
    });
};