const Agenda = require("agenda");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;

const init = function (app, callback) {
    let agenda = new Agenda({mongo: Config.jobsStorageClient});
    Config.jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];
    Config.jobTypes.forEach(function(type) {
        //TODO change this para um for para tudo o que está dentro DA PASTA
        require(Pathfinder.absPathInSrcFolder("/jobs/jobsStartup/" + type))(agenda);
    });
    Config.agenda = agenda;
    require(Pathfinder.absPathInSrcFolder("/jobs/jobsEvents/mainHandler.js"));
    callback(null);
};
module.exports.init = init;