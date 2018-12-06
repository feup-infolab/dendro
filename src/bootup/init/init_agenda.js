const Agenda = require("agenda");
const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const init = function (app, callback)
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
                Job._jobTypes.forEach(function (jobType)
                {
                    jobType.fetchJobsStillInMongoAndRestartThem();
                });
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
