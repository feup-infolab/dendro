const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;

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