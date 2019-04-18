const rlequire = require("rlequire");
const path = require("path");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;

const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const name = path.parse(__filename).name;

class EmbargoedDeposit extends Job
{
    // STATIC METHODS
    static defineJob ()
    {
        const jobDefinitionFunction = function (job, done)
        {
            Logger.log("info", "This is a embargoedDeposit job, running at " + new Date().toDateString() + "Hello!!!");
            Deposit.getDepositsEmbargoed(function (err, result)
            {
                if (isNull(err))
                {
                    result.forEach(function (deposit)
                    {
                        deposit.ddr.privacyStatus = "public";
                        deposit.ddr.embargoedDate = null;
                        deposit.save(function (err, result)
                        {
                            if (isNull(err))
                            {

                            }
                            else
                            {

                            }
                        });
                    });
                    done();
                }
                else
                {
                    Logger.log("error", "Error at " + name + " , error: " + JSON.stringify(err));
                    Logger.log("debug", "Will remove " + name + " job");
                    job.remove(function (err)
                    {
                        if (isNull(err))
                        {
                            Logger.log("info", "Successfully removed " + name + " job from collection");
                        }
                        else
                        {
                            Logger.log("error", "Could not remove " + name + " job from collection");
                        }
                    });
                }
            });
        };
        super.defineJob(name, jobDefinitionFunction);
    }

    static registerJobEvents ()
    {
        const self = this;
        const successHandlerFunction = function (job)
        {
            Logger.log("info", name + " executed Successfully");
            if (!self.isSingleton)
            {
                job.remove(function (err)
                {
                    if (isNull(err))
                    {
                        Logger.log("info", "Successfully removed " + name + " job from collection");
                    }
                    else
                    {
                        Logger.log("error", "Could not remove " + name + " job from collection");
                    }
                });
            }
        };

        const errorHandlerFunction = function (job)
        {
            Logger.log("info", name + " job failed, error: " + JSON.stringify(job));
            job.remove(function (err)
            {
                if (isNull(err))
                {
                    Logger.log("info", "Successfully removed " + name + " job from collection");
                }
                else
                {
                    Logger.log("error", "Could not remove " + name + " job from collection");
                }
            });
        };

        super.registerJobEvents(name, successHandlerFunction, errorHandlerFunction);
    }

    static startJobs ()
    {
        const restartJobFunction = function (jobs)
        {
            if (!isNull(jobs) && jobs.length > 0)
            {
                jobs.forEach(function (job)
                {
                    Logger.log("info", "Will attempt to run " + name);
                    job.attrs.lockedAt = null;
                    job.schedule(new Date());
                    job.save();
                });
                let msg = "There are " + jobs.length + " of type " + name + " that will attempt running again!";
                Logger.log("debug", msg);
            }
            else
            {
                const msg = "No " + name + " jobs in mongodb to attempt running again!";
                Logger.log("debug", msg);
            }
        };
        super.startJobs(name, restartJobFunction);
    }

    // INSTANCE METHODS
    constructor (jobData)
    {
        super(name, jobData);
    }

    start (callback)
    {
        super.start(function (err)
        {
            callback(err);
        });
    }
}

EmbargoedDeposit.isSingleton = true;
EmbargoedDeposit.cronExpression = "2 seconds";

module.exports.TestJob = EmbargoedDeposit;
