const Pathfinder = global.Pathfinder;
const path = require("path");
const async = require("async");
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;


const getJobsFromMongoDbAndScheduleAgain = function (callback) {
    async.waterfall([
        function (callback)
        {
            //TODO get all jobs from mongodb and schedule them again
            require(Pathfinder.absPathInSrcFolder("/jobs/jobsStartup/fetchFromMongoDB/importProjectJob.js")).init(function (err, info) {
                callback(err, info);
            });

        }
    ], function (err, results)
    {
        //Agenda only starts at this point because only here all the jobs were fetched from mongodb and scheduled
        Config.agenda.start();
        Logger.log("info", "Agenda is now started!");
        callback(err, results);
    });
};

if(!isNull(Config.jobTypes) && Config.jobTypes.length > 0) {
    Config.agenda.on("ready", function() {
        getJobsFromMongoDbAndScheduleAgain(function (err, info) {
            //TODO register all job events handlers here
            require(Pathfinder.absPathInSrcFolder("/jobs/jobsEvents/importProjectHandler.js"));
        });
    });
}