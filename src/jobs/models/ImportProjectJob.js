const slug = require("slug");
const path = require("path");
const async = require("async");
const fs = require("fs");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Job = require(Pathfinder.absPathInSrcFolder("/jobs/models/Job.js")).Job;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const projects = require(Pathfinder.absPathInSrcFolder("/controllers/projects.js"));
const name = path.parse(__filename).name;

class ImportProjectJob extends Job
{
    //STATIC METHODS
    static defineJob ()
    {
        const jobDefinitionFunction = function (job, done) {
            let uploadedBackupAbsPath = job.attrs.data.uploadedBackupAbsPath;
            let userAndSessionInfo = job.attrs.data.userAndSessionInfo;
            let newProject = job.attrs.data.newProject;
            projects.processImport(newProject.uri, uploadedBackupAbsPath, userAndSessionInfo, function (err, info) {
                if (isNull(err))
                {
                    Logger.log("info", "Project with uri: " + newProject.uri + " was successfully restored");
                    Logger.log("info", "Will remove "  + name + "job");
                    done();
                }
                else
                {
                    Logger.log("error", "Error restoring a project with uri: " + newProject.uri + ", error: " + JSON.stringify(info));
                    if(!isNull(newProject))
                    {
                        Project.findByUri(newProject.uri, function (err, createdProject) {
                            if(isNull(err))
                            {
                                if(!isNull(createdProject))
                                {
                                    delete createdProject.ddr.is_being_imported;
                                    createdProject.ddr.hasErrors = "There was an error during a project restore, error message : " + JSON.stringify(info);
                                    createdProject.save(function (err, result)
                                    {
                                        if (!isNull(err))
                                        {
                                            Logger.log("error", "Error when saving a project error message from a restore operation, error: " + JSON.stringify(result));
                                        }
                                        done(JSON.stringify(info))
                                    });
                                }
                                else
                                {
                                    Logger.log("error", "Error at " + name +" , project with uri: " + newProject.uri +  " does not exist");
                                    Logger.log("error", "Will remove " + name + " job");
                                    job.remove(function(err) {
                                        if(isNull(err))
                                        {
                                            Logger.log("info", "Successfully removed " + name + " job from collection");
                                        }
                                        else
                                        {
                                            Logger.log("error", "Could not remove " + name +" job from collection");
                                        }
                                    })
                                }
                            }
                            else
                            {
                                Logger.log("error", "Error at " + name + " , error: " + JSON.stringify(createdProject));
                                Logger.log("error", "Will remove " + name + " job");
                                job.remove(function(err) {
                                    if(isNull(err))
                                    {
                                        Logger.log("info", "Successfully removed " + name + " job from collection");
                                    }
                                    else
                                    {
                                        Logger.log("error", "Could not remove " + name + " job from collection");
                                    }
                                })
                            }
                        });
                    }
                }
            }, job);
        };
        super.defineJob(name, jobDefinitionFunction);
    }

    static registerJobEvents ()
    {
        const successHandlerFunction = function (job) {
            Logger.log("info", "Imported project Successfully");
            const parentPath = path.resolve(job.attrs.data.uploadedBackupAbsPath, "..");
            if(!isNull(parentPath))
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
        };

        const errorHandlerFunction = function (job)
        {
            Logger.log("info", name + " job failed, error: " + JSON.stringify(job));
            const parentPath = path.resolve(job.attrs.data.uploadedBackupAbsPath, "..");
            if(!isNull(parentPath))
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

    static fetchJobsStillInMongoAndRestartThem ()
    {
        const restartJobFunction = function (jobs) {
            const canImportProjectJobRestart = function (job, callback) {

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
                        if(isNull(err))
                        {
                            if(isNull(project))
                            {
                                const errorMessage = "Project specified in job.attrs.data.newProject.uri does not exist";
                                Logger.log("error", errorMessage);
                                return callback(true, false);
                            }
                            else
                            {
                                project.getActiveStorageConfig(function (err, config)
                                {
                                    if (isNull(err) && !isNull(config))
                                    {
                                        return callback(null, true);
                                    }
                                    else
                                    {
                                        const errorMessage = "There was an error when looking for the project storage configuration specified in job.attrs.data.newProject.uri, error: " + JSON.stringify(config);
                                        Logger.log("error", errorMessage);
                                        return callback(true, false);
                                    }
                                });
                            }
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
                            mainZipFileExists(job, function (err, result) {
                                callback(err);
                            });
                        },
                        function (callback)
                        {
                            projectAndStorageConfigurationExist(job, function (err, result) {
                                callback(err);
                            });
                        }],
                    function (err, results)
                    {
                        if(!isNull(err))
                        {
                            callback(true, false);
                        }
                        else
                        {
                            callback(null, true);
                        }
                    });
            };

            if(!isNull(jobs) && jobs.length > 0)
            {
                let errorMessages = [];
                jobs.forEach(function (job) {
                    canImportProjectJobRestart(job, function (err, canIt) {
                        if(isNull(err) && canIt === true)
                        {
                            Logger.log("info", "Will attempt to import project " + job.attrs.data.newProject.uri  + " again");
                            job.attrs.lockedAt = null;
                            job.schedule(new Date());
                            job.save();
                        }
                        else
                        {
                            const errorMsg = "Cannot attempt to import project " + job.attrs.data.newProject.uri  + "again, the backup zip no longer exists!";
                            Logger.log("error", errorMsg);
                            Logger.log("info", "Removing " + name + " job from mongodb!");
                            errorMessages.push(errorMsg);
                            Project.findByUri(job.attrs.data.newProject.uri, function (err, project)
                            {
                                if(isNull(err) && !isNull(project))
                                {
                                    delete project.ddr.is_being_imported;
                                    project.ddr.hasErrors = errorMsg;
                                    project.save(function (err, info) {
                                        if(!isNull(err))
                                        {
                                            Logger.log("error", JSON.stringify(err));
                                        }
                                    });
                                }
                                job.remove(function(err) {
                                    if(isNull(err))
                                    {
                                        Logger.log("info", "Successfully removed " + name + " job from collection");
                                    }
                                    else
                                    {
                                        const errorMessage = "Could not remove " + name +  " job from collection";
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
                const msg = "No " + name  + " jobs in mongodb to attempt running again!";
                Logger.log("info", msg);
            }
        };
        super.fetchJobsStillInMongoAndRestartThem(name, restartJobFunction);
    }

    //INSTANCE METHODS
    constructor (jobData)
    {
        super(name, jobData);
    }

    start (callback)
    {
        super.start(function (err) {
            callback(err);
        });
    }
}

module.exports.ImportProjectJob = ImportProjectJob;
