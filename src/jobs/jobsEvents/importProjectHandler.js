const fs = require("fs");
const async = require("async");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
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

Config.agenda.on("ready", function() {
    Logger.log("info", "Attempting to restart any Import Project job reamining in mongodb");
    Config.agenda.jobs({name: "import project"}, function(err, jobs) {
        // Work with jobs (see below)
        if(!isNull(jobs) && jobs.length > 0)
        {
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
                        Logger.log("error", "Cannot attempt to import project " + job.attrs.data.newProject.uri  + "again");
                        Logger.log("info", "Removing job from mongodb!");
                        job.remove(function(err) {
                            //TODO CHANGE THIS
                            //Logger.log("info", "Agenda will start now!");
                            //Config.agenda.start();
                            if(isNull(err))
                            {
                                Logger.log("info", 'Successfully removed job from collection');
                            }
                            else
                            {
                                Logger.log("error", 'Could not remove job from collection');
                            }
                        });
                    }
                    Logger.log("info", "Agenda will start now!");
                    Config.agenda.start();
                });
            });
        }
        else
        {
            Logger.log("info", "No import project jobs in mongodb!");
            Logger.log("info", "Agenda will start now!");
            Config.agenda.start();
        }
    });
});

Config.agenda.on("success:import project", function(job) {
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
            Logger.log("info", 'Successfully removed job from collection');
        }
        else
        {
            Logger.log("error", 'Could not remove job from collection');
        }
    });
});

Config.agenda.on('fail:import project', function(err, job) {
    Logger.log("info", "Import project job failed, error: " + JSON.stringify(err));
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
});