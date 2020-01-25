const rlequire = require("rlequire");
const path = require("path");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;

const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const name = path.parse(__filename).name;
const async = require("async");
const _ = require("underscore");

class MonitorUnSyncedNotebooksJob extends Job
{
    // STATIC METHODS
    static defineJob ()
    {
        const jobDefinitionFunction = function (job, done)
        {
            Logger.log("info", "This is a Notebook monitor job, running at " + new Date().toDateString());
            Notebook.getActiveNotebooks(function (err, activeNotebookInformation)
            {
                if (isNull(err))
                {
                    async.forEachSeries(activeNotebookInformation, function (notebookInfo, callback)
                    {
                        if (!isNull(notebookInfo) && notebookInfo.notebookObject instanceof Notebook)
                        {
                            notebookInfo.notebookObject.isUnsynced(
                                notebookInfo.lastModified,
                                function (err, notebookIsUnsynced)
                                {
                                    notebookInfo.isUnsynced = notebookIsUnsynced;
                                    callback(err);
                                });
                        }
                        else
                        {
                            // if there is no match for the notebook, we clean up the old folder by force
                            Logger.log("Deleting orphan notebook folder at " + notebookInfo.runningPath);
                            Folder.deleteOnLocalFileSystem(notebookInfo.runningPath, function (error, stdout, stderror)
                            {
                                callback(err, stdout, stderror);
                            }, true);
                        }
                    }, function (err)
                    {
                        if (isNull(err))
                        {
                            const unSyncedNotebooks = _.filter(activeNotebookInformation, function (notebookInfo)
                            {
                                if (notebookInfo.isUnsynced)
                                {
                                    return true;
                                }
                                return false;
                            });

                            const syncedNotebooks = _.filter(activeNotebookInformation, function (notebookInfo)
                            {
                                if (!notebookInfo.isUnsynced && notebookInfo.notebookObject instanceof Notebook)
                                {
                                    return true;
                                }
                                return false;
                            });

                            // se estiver sincronizado
                            // 1. Fechar Container
                            // 2. Apagar pasta

                            Notebook.shutdownAndCleanupNotebooks(
                                _.map(syncedNotebooks, function (notebookInformation)
                                {
                                    return notebookInformation.notebookObject;
                                }),
                                function (err)
                                {
                                    console.log("this is the callback from getSyncedNotebooks " + unSyncedNotebooks);
                                    if (isNull(err))
                                    {
                                        console.log("Cleaned Up Notebook");
                                    }
                                    else
                                    {
                                        console.log("Did not cleanup notebook");
                                    }
                                });

                            // se não estiver sincronizado
                            // 1. Save notebook files

                            Notebook.saveNotebookFiles(
                                _.map(unSyncedNotebooks, function (notebookInformation)
                                {
                                    return notebookInformation.notebookObject;
                                }),
                                function (err)
                                {
                                    console.log("this is the callback from getUnsynced " + unSyncedNotebooks);
                                    if (isNull(err))
                                    {
                                        console.log("SavedNotebook");
                                    }
                                    else
                                    {
                                        console.log("DidNotSaveNotebook");
                                    }
                                });
                        }
                        else
                        {
                            Logger.log(err);
                        }
                    });
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
// MonitorUnSyncedNotebooksJob.cronExpression = Config.jobs.notebooksync.notebook_sync_cron;

module.exports.MonitorUnSyncedNotebooksJob = MonitorUnSyncedNotebooksJob;
