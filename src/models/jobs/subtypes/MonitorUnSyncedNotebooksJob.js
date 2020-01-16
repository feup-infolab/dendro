const rlequire = require("rlequire");
const path = require("path");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;

const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const name = path.parse(__filename).name;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const async = require("async");

class MonitorUnSyncedNotebooksJob extends Job
{
    // STATIC METHODS
    static defineJob ()
    {
        const jobDefinitionFunction = function (job, done)
        {
            Logger.log("info", "This is a Notebook monitor job, running at " + new Date().toDateString());
            Notebook.getActiveNotebooks( function (err, existingNotebooks) {
                if (isNull(err))
                {
                    console.log(existingNotebooks);
                    Logger.log("Finished searching for Active Notebooks");

                }
                else
                {
                    Logger.log("error", "No active notebooks");
                }

            });

            // Notebook.getNotebookFolders(function (err, result)
            // {
            //     if (isNull(err))
            //     {
            //         Notebook.checkUpdatedNotebooks(result);
            //     }
            //     else
            //     {
            //         Logger.log("error", "Error at " + name + " , error: " + JSON.stringify(err));
            //         Logger.log("debug", "Will remove " + name + " job");
            //         job.remove(function (err)
            //         {
            //             if (isNull(err))
            //             {
            //                 Logger.log("info", "Successfully removed " + name + " job from collection");
            //             }
            //             else
            //             {
            //                 Logger.log("error", "Could not remove " + name + " job from collection");
            //             }
            //         });
            //     }
            // });

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

MonitorUnSyncedNotebooksJob.isSingleton = true;
//MonitorUnSyncedNotebooksJob.cronExpression = Config.jobs.notebooksync.notebook_sync_cron;

module.exports.MonitorUnSyncedNotebooksJob = MonitorUnSyncedNotebooksJob;
