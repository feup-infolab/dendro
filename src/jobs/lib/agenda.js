const Agenda = require("agenda");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

//const mongoConnectionString = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + "agenda";
const mongoConnectionString = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/jobCollectionName";
//let mongoConnectionString = 'mongodb://127.0.0.1/agenda';

//let agenda = new Agenda({db: {address: mongoConnectionString, collection: "jobCollectionName"}});
/*var agenda = new Agenda({mongo: Config.jobsStorageClient});
let jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
    //require('../jobs/' + type)(agenda);
    require(Pathfinder.absPathInSrcFolder("/jobs/" + type))(agenda);
});*/

if(!isNull(Config.jobTypes) && Config.jobTypes.length) {
    Config.agenda.on("ready", function() {
        Config.agenda.jobs({name: "import project"}, function(err, jobs) {
            // Work with jobs (see below)
            if(isNull(jobs) && jobs.length > 0)
            {
                jobs.forEach(function (job) {
                    job.run(function(err, job) {
                        if(!isNull(err))
                        {
                            Logger.log("info", "Restarted job: " + JSON.stringify(job._id));
                        }
                        else
                        {
                            Logger.log("error", "Could not restart job: " + JSON.stringify(job._id) + " error: " + JSON.stringify(err));
                        }
                    });
                });
            }
            Logger.log("info", "Agenda will start now!");
            Config.agenda.start();
        });
    });

    Config.agenda.on("success:import project", function(job) {
        Logger.log("info", "Imported project Successfully");
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
    });
}

//module.exports = agenda;
//module.exports.init = init;