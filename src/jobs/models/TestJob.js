const path = require("path");
const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Job = require(Pathfinder.absPathInSrcFolder("/jobs/models/Job.js")).Job;
const name = path.parse(__filename).name;

class TestJob extends Job
{
    static callDefine ()
    {
        Job._agenda.define(name, function (job, done) {
            Logger.log("info", "This is a test job, Hello!!!");
            done();
        });
    }

    static registerJobEvents ()
    {
        Job._agenda.on("success:" + name, function(job) {
            Logger.log("info", name + " executed Successfully");
            job.remove(function(err) {
                if(isNull(err))
                {
                    Logger.log("info", "Successfully removed " + name + " job from collection");
                }
                else
                {
                    Logger.log("error", "Could not remove " + name + " job from collection");
                }
            });
        });

        Job._agenda.on("fail:" + name, function(err, job) {
            Logger.log("info", name + " job failed, error: " + JSON.stringify(err));
        });
    }

    static fetchJobsStillInMongoAndRestartThem ()
    {
        super.fetchJobsStillInMongoAndRestartThem(name, function (err, jobs) {
            if(!isNull(jobs) && jobs.length > 0)
            {
                let errorMessages = [];
                jobs.forEach(function (job) {
                    Logger.log("info", "Will attempt to run " + name);
                    job.attrs.lockedAt = null;
                    job.schedule(new Date());
                    job.save();
                });
                let msg = "There are " + jobs.length + " of type " + name + " that will attempt running again!";
                Logger.log("info", msg);
            }
            else
            {
                const msg = "No " + name +  " jobs in mongodb to attempt running again!";
                Logger.log("info", msg);
            }
        });
    }

    constructor (jobData)
    {
        super(name, jobData);
    }

    start (callback)
    {
        let self = this;
        super.start(function (err) {
            callback(err);
        });
    }
}

module.exports.TestJob = TestJob;
