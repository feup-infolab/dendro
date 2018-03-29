const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Job = require(Pathfinder.absPathInSrcFolder("/jobs/models/Job.js")).Job;

class TestJob extends Job
{
    static callDefine ()
    {
        Job._agenda.define("TestJob", function (job, done) {
            Logger.log("info", "This is a test job, Hello!!!");
            done();
        });
    }

    static registerJobEvents ()
    {
        Job._agenda.on("success:TestJob", function(job) {
            Logger.log("info", "test job executed Successfully");
            job.remove(function(err) {
                if(isNull(err))
                {
                    Logger.log("info", 'Successfully removed job from collection');
                }
                else
                {
                    Logger.log("error", 'Could not remove job from collection');
                }
            });
        });

        Job._agenda.on('fail:TestJob', function(err, job) {
            Logger.log("info", "test job failed, error: " + JSON.stringify(err));
        });
    }

    static fetchJobsStillInMongoAndRestartThem ()
    {
        Logger.log("info", "Attempting to restart any test job remaining in mongodb");
        Job._agenda.jobs({name: "TestJob"}, function(err, jobs) {
            if(!isNull(jobs) && jobs.length > 0)
            {
                let errorMessages = [];
                jobs.forEach(function (job) {
                    Logger.log("info", "Will attempt to run test job");
                    job.attrs.lockedAt = null;
                    job.schedule(new Date());
                    job.save();
                });
                let msg = "There are " + jobs.length + " of type test job that will attempt running again!";
                Logger.log("info", msg);
                //callback(null, message);
            }
            else
            {
                const msg = "No test jobs in mongodb to attempt running again!";
                Logger.log("info", msg);
                //callback(null, msg);
            }
        });
    }

    constructor (jobData)
    {
        super("TestJob", jobData);
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
