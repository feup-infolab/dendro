const fs = require("fs");
const async = require("async");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

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

module.exports.init = function (callback) {
    Logger.log("info", "Attempting to restart any Import Project job remaining in mongodb");
    Config.agenda.jobs({name: "import project"}, function(err, jobs) {
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
                        const errorMsg = "Cannot attempt to import project " + job.attrs.data.newProject.uri  + "again";
                        Logger.log("error", errorMsg);
                        Logger.log("info", "Removing job from mongodb!");
                        errorMessages.push(errorMsg);
                        job.remove(function(err) {
                            if(isNull(err))
                            {
                                Logger.log("info", "Successfully removed job from collection");
                            }
                            else
                            {
                                const errorMessage = "Could not remove job from collection";
                                Logger.log("error", errorMessage);
                                errorMessages.push(errorMessage);
                            }
                        });
                    }
                });
            });

            let hasErrors = errorMessages.length > 0;
            let message = hasErrors === true ? JSON.stringify(errorMessages) : "There are " + jobs.length + " of type Import Project that will attempt running again!";
            callback(hasErrors, message);
        }
        else
        {
            const msg = "No import project jobs in mongodb to attempt running again!";
            Logger.log("info", msg);
            callback(null, msg);
        }
    });
};