const Agenda = require("agenda");
const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

//const mongoConnectionString = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + "agenda";
const mongoConnectionString = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoJobCollectionName;
//let mongoConnectionString = 'mongodb://127.0.0.1/agenda';

//let agenda = new Agenda({db: {address: mongoConnectionString, collection: "jobCollectionName"}});
/*var agenda = new Agenda({mongo: Config.jobsStorageClient});
let jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
    //require('../jobs/' + type)(agenda);
    require(Pathfinder.absPathInSrcFolder("/jobs/" + type))(agenda);
});*/

const init = function (app, callback) {
    //let agenda = new Agenda({db: {address: mongoConnectionString, collection: "jobCollectionName"}});
    let agenda = new Agenda({mongo: Config.jobsStorageClient});
    Config.jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

    Config.jobTypes.forEach(function(type) {
        //require('../jobs/' + type)(agenda);
        require(Pathfinder.absPathInSrcFolder("/jobs/" + type))(agenda);
    });
    Config.agenda = agenda;
    require(Pathfinder.absPathInSrcFolder("/jobs/lib/agenda.js"));
    callback(null);
};


module.exports.init = init;