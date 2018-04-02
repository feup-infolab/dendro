const Agenda = require("agenda");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Job = require(Pathfinder.absPathInSrcFolder("/jobs/models/Job.js")).Job;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const init = function (app, callback) {
    Job._jobTypes = [];
    Job._agenda = null;
    Job._jobsStorageClient = null;
    Job.initDependencies(function (err)
    {
        if(isNull(err))
        {
            Job._agenda.on("ready", function()
            {
                Job._agenda.start();
                //AGENDA is now properly initiated and all jobs are defined and have its handlers registered
                //So only now can any job still in mongoDB be fetched and restarted again
                if(!isNull(Job._jobTypes) && Job._jobTypes.length > 0)
                {
                    Job._jobTypes.forEach(function(type)
                    {
                        let JobType = require(Pathfinder.absPathInSrcFolder("/jobs/models/" + type))[type];
                        JobType.fetchJobsStillInMongoAndRestartThem();
                    });
                }
                else
                {
                    Logger.log("info", "There are no Jobs set to run in the deployment_config file!");
                }
                callback(err);
            });
        }
        else
        {
            callback(err);
        }
    });
};
module.exports.init = init;