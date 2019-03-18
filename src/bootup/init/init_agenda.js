const Agenda = require("agenda");
const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const init = function (app, callback)
{
    if(!isNull(process.env.NODE_ENV) && process.env.NODE_ENV !== "test")
    {
        Job._jobTypes = [];
        Job._agenda = null;
        Job._jobsStorageClient = null;
        Job.initDependencies(function (err)
        {
            if (isNull(err))
            {
                Job._agenda.on("ready", function ()
                {
                    Job._agenda.start();
                    // AGENDA is now properly initiated and all jobs are defined and have its handlers registered
                    // So only now can any job still in mongoDB be fetched and restarted again
                    if (!isNull(Job._jobTypes) && Job._jobTypes.length > 0)
                    {
                        Job._jobTypes.forEach(function (type)
                        {
                            type.fetchJobsStillInMongoAndRestartThem();
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
    }
    else
    {
        callback(null);
    }
};
module.exports.init = init;
