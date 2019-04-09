const rlequire = require("rlequire");
const path = require("path");
const async = require("async");
const fs = require("fs");

const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

const Job = rlequire("dendro", "src/models/jobs/Job.js").Job;
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;
const Project = rlequire("dendro", "src/models/project.js").Project;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const name = path.parse(__filename).name;

class ImportProjectJob extends Job
{
    // STATIC METHODS
    static defineJob ()
    {
        const jobDefinitionFunction = function (job, done)
        {
            let uploadedBackupAbsPath = job.attrs.data.uploadedBackupAbsPath;
            let userAndSessionInfo = job.attrs.data.userAndSessionInfo;
            let newProject = new Project(job.attrs.data.newProject);
            const userIsAdmin = (userAndSessionInfo.user.isAdmin || userAndSessionInfo.session.isAdmin);

            Project.unzipAndValidateBagItBackupStructure(uploadedBackupAbsPath, Config.maxProjectSize, userIsAdmin, function (err, result)
            {
                if (!err)
                {
                    newProject.importFromBagItBackupDirectory(uploadedBackupAbsPath, userAndSessionInfo, function (err, info)
                    {
                        if (isNull(err))
                        {
                            Logger.log("info", "Project with uri: " + newProject.uri + " was successfully restored");
                            Logger.log("debug", "Will remove " + name + " job");
                            done();
                        }
                        else
                        {
                            Logger.log("error", "Error restoring a project with uri: " + newProject.uri + ", error: " + JSON.stringify(info));
                            if (!isNull(newProject))
                            {
                                Project.findByUri(newProject.uri, function (err, createdProject)
                                {
                                    if (isNull(err))
                                    {
                                        if (!isNull(createdProject))
                                        {
                                            delete createdProject.ddr.is_being_imported;
                                            const msg = "Error when saving a project error message from a restore operation, error: " + JSON.stringify(result);
                                            createdProject.ddr.hasErrors = msg;
                                            createdProject.save(function (err, result)
                                            {
                                                if (!isNull(err))
                                                {
                                                    Logger.log("error");
                                                }
                                                done(msg);
                                            });
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error at " + name + " , project with uri: " + newProject.uri + " does not exist");
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
                                    }
                                    else
                                    {
                                        Logger.log("error", "Error at " + name + " , error: " + JSON.stringify(createdProject));
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
                            }
                        }
                    }, job);
                }
                else
                {
                    const msg = "Invalid file structure for " + uploadedBackupAbsPath + " when performing a restore operation, error: " + JSON.stringify(result);
                    Logger.log("error", msg);
                    done(msg);
                }
            });
        };
        super.defineJob(name, jobDefinitionFunction);
    }

    static registerJobEvents ()
    {
        const successHandlerFunction = function (job)
        {
            const msg = "Imported project Successfully";
            Logger.log("info", msg);
            const Notification = rlequire("dendro", "src/models/notifications/notification.js").Notification;
            Notification.buildAndSaveFromSystemMessage(msg, job.attrs.data.userAndSessionInfo.user.uri, function (err, info)
            {
                Logger.log("info", "Imported project notification sent");
            }, job.attrs.data.newProject.uri);

            const parentPath = path.resolve(job.attrs.data.uploadedBackupAbsPath, "..");
            if (!isNull(parentPath))
            {
                File.deleteOnLocalFileSystem(parentPath, function (err, result)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "Error occurred while deleting backup zip file at " + parentPath + " : " + JSON.stringify(result));
                    }
                });
            }
            else
            {
                Logger.log("error", "Could not calculate parent path of: " + job.attrs.data.uploadedBackupAbsPath);
            }
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

        const errorHandlerFunction = function (job)
        {
            Logger.log("info", name + " job failed, error: " + JSON.stringify(job));
            const parentPath = path.resolve(job.attrs.data.uploadedBackupAbsPath, "..");
            if (!isNull(parentPath))
            {
                File.deleteOnLocalFileSystem(parentPath, function (err, result)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "Error occurred while deleting backup zip file at " + parentPath + " : " + JSON.stringify(result));
                    }
                });
            }
            else
            {
                Logger.log("error", "Could not calculate parent path of: " + job.attrs.data.uploadedBackupAbsPath);
            }
        };

        super.registerJobEvents(name, successHandlerFunction, errorHandlerFunction);
    }

    static startJobs ()
    {
        const restartJobFunction = function (jobs)
        {
            const clearTempFolderDependenciesForPreviousJobTry = function (job)
            {
                if (!isNull(job) && !isNull(job.attrs) && !isNull(job.attrs.data) && !isNull(job.attrs.data.absPathOfUnzippedBagIt) && fs.existsSync(job.attrs.data.absPathOfUnzippedBagIt))
                {
                    File.deleteOnLocalFileSystem(job.attrs.data.absPathOfUnzippedBagIt, function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error occurred while deleting job.attrs.data.absPathOfUnzippedBagIt : " + JSON.stringify(result));
                        }
                    });
                }
            };

            const canImportProjectJobRestart = function (job, callback)
            {
                const mainZipFileExists = function (job, callback)
                {
                    if (fs.existsSync(job.attrs.data.uploadedBackupAbsPath))
                    {
                        callback(null, true);
                    }
                    else
                    {
                        callback(true, false);
                    }
                };

                const projectAndStorageConfigurationExist = function (job, callback)
                {
                    Project.findByUri(job.attrs.data.newProject.uri, function (err, project)
                    {
                        if (isNull(err))
                        {
                            if (isNull(project))
                            {
                                const errorMessage = "Project specified in job.attrs.data.newProject.uri does not exist";
                                Logger.log("error", errorMessage);
                                return callback(true, false);
                            }

                            project.getActiveStorageConfig(function (err, config)
                            {
                                if (isNull(err) && !isNull(config))
                                {
                                    return callback(null, true);
                                }

                                const errorMessage = "There was an error when looking for the project storage configuration specified in job.attrs.data.newProject.uri, error: " + JSON.stringify(config);
                                Logger.log("error", errorMessage);
                                return callback(true, false);
                            });
                        }
                        else
                        {
                            const errorMessage = "There was an error when looking for the project specified in job.attrs.data.newProject.uri, error: " + JSON.stringify(project);
                            Logger.log("error", errorMessage);
                            return callback(true, false);
                        }
                    });
                };

                async.waterfall([
                    function (callback)
                    {
                        mainZipFileExists(job, function (err, result)
                        {
                            callback(err);
                        });
                    },
                    function (callback)
                    {
                        projectAndStorageConfigurationExist(job, function (err, result)
                        {
                            callback(err);
                        });
                    }],
                function (err, results)
                {
                    if (!isNull(err))
                    {
                        callback(true, false);
                    }
                    else
                    {
                        callback(null, true);
                    }
                });
            };

            if (!isNull(jobs) && jobs.length > 0)
            {
                let errorMessages = [];
                jobs.forEach(function (job)
                {
                    canImportProjectJobRestart(job, function (err, canIt)
                    {
                        clearTempFolderDependenciesForPreviousJobTry(job);
                        if (isNull(err) && canIt === true)
                        {
                            Logger.log("info", "Will attempt to import project " + job.attrs.data.newProject.uri + " again");
                            job.attrs.lockedAt = null;
                            job.schedule(new Date());
                            job.save();
                        }
                        else
                        {
                            const errorMsg = "Cannot attempt to import project " + job.attrs.data.newProject.uri + "again, the backup zip no longer exists!";
                            Logger.log("error", errorMsg);
                            Logger.log("info", "Removing " + name + " job from mongodb!");
                            errorMessages.push(errorMsg);
                            Project.findByUri(job.attrs.data.newProject.uri, function (err, project)
                            {
                                if (isNull(err) && !isNull(project))
                                {
                                    delete project.ddr.is_being_imported;
                                    project.ddr.hasErrors = errorMsg;
                                    project.save(function (err, info)
                                    {
                                        if (!isNull(err))
                                        {
                                            Logger.log("error", JSON.stringify(err));
                                        }
                                    });
                                }
                                job.remove(function (err)
                                {
                                    if (isNull(err))
                                    {
                                        Logger.log("info", "Successfully removed " + name + " job from collection");
                                    }
                                    else
                                    {
                                        const errorMessage = "Could not remove " + name + " job from collection";
                                        Logger.log("error", errorMessage);
                                        errorMessages.push(errorMessage);
                                    }
                                });
                            });
                        }
                    });
                });

                let hasErrors = errorMessages.length > 0;
                let message = hasErrors === true ? JSON.stringify(errorMessages) : "There are " + jobs.length + " of type " + name + " that will attempt running again!";
                Logger.log("info", message);
            }
            else
            {
                const msg = "No " + name + " jobs in mongodb to attempt running again!";
                Logger.log("info", msg);
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

module.exports.ImportProjectJob = ImportProjectJob;
