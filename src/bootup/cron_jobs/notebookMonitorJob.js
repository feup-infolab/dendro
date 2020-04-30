var CronJob = require("cron").CronJob;
const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const tmpLocation = Config.tempFilesDir;
const exec = require("child_process").exec;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const fs = require("fs");
const path = require("path");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;

const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const name = path.parse(__filename).name;
const async = require("async");
const _ = require("underscore");


const notebookMonitorJob = function (app, callback)
{
    Logger.log("info", "Notebook Monitor Job has launched");
    const monitorJobStart = function (cb){
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
                            if (isNull(err))
                            {
                                console.log("Notebooks were shut down successfully!");
                            }
                            else
                            {
                                console.log("Notebook shut down failed!");
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
                            if (isNull(err))
                            {
                                console.log("Notebooks were Synced Successfully!");
                            }
                            else
                            {
                                console.log("Notebook Sync has Failed!");
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
};
    try
    {
        // Every hour
        let job = new CronJob("*/5 * * * *", function ()
        {
            monitorJobStart(function (err, result)
            {
                if (!isNull(err))
                {
                    Logger.log("error", result);
                }
                else
                {
                    Logger.log("info", result);
                }
            });
        }, null, true, "America/Los_Angeles");
            job.start();
            const jobMsg = "Notebook Monitor job started";
            Logger.log("info", jobMsg);
            callback(null, null);
    }
    catch (ex)
    {
        const errMsg = "Invalid Notebook Monitor job pattern: " + ex.toString();
        Logger.log("error", errMsg);
        callback(true, errMsg);
    }
};

module.exports.notebookMonitorJob = notebookMonitorJob;
