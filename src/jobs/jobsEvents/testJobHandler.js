const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;

Config.agenda.on("success:test job", function(job) {
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

Config.agenda.on('fail:test job', function(err, job) {
    Logger.log("info", "test job failed, error: " + JSON.stringify(err));
});