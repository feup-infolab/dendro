const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const MongoClient = require("mongodb").MongoClient;
const Agenda = require("agenda");
const fs = require("fs");

class Job
{
    //STATIC METHODS
    static initDependencies (callback)
    {
        const initAgenda = function (callback) {
            const url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoJobCollectionName;
            try
            {
                Logger.log_boot_message("Connecting to MongoDB Jobs storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
                let agenda = new Agenda({db: {address: url}});
                Job._agenda = agenda;
            }
            catch (error)
            {
                const errorMsg = "Error connecting to MongoDB Jobs storage, error: " + JSON.stringify(error);
                Logger.log("error", errorMsg);
                return callback(errorMsg);
            }
            try
            {
                Job._jobTypes = Config.jobTypes ? Config.jobTypes.split(',') : [];
            }
            catch(error)
            {
                Job._jobTypes = [];
            }

            if(!isNull(Job._jobTypes) && Job._jobTypes.length > 0)
            {
                Job._jobTypes.forEach(function(type) {
                    let JobType = require(Pathfinder.absPathInSrcFolder("/jobs/models/" + type))[type];
                    JobType.defineJob();
                    JobType.registerJobEvents();
                });
            }
            else
            {
                Logger.log("info", "There are no Jobs set to run in the deployment_config file!");
            }
            callback(null);
        };


        initAgenda(function (err)
        {
            if(isNull(err))
            {
                Logger.log("info", "Job dependencies are now set!");
                callback(null);
            }
            else
            {
                Logger.log("error", "Job dependencies Agenda error: "  + JSON.stringify(err));
                callback(err);
            }
        });
    }

    static registerJobEvents (jobName, successHandlerFunction, errorHandlerFunction)
    {
        Job._agenda.on("success:" + jobName, function(job) {
            successHandlerFunction(job);
        });

        Job._agenda.on("fail:" + jobName, function(err, job) {
            errorHandlerFunction(job);
        });
    }

    static defineJob (jobName, jobDefinitionFunction)
    {
        Job._agenda.define(jobName, function (job, done) {
            jobDefinitionFunction(job, done);
        });
    }

    static fetchJobsStillInMongoAndRestartThem (jobName, restartJobFunction)
    {
        Logger.log("info", "Attempting to restart any " + jobName +" remaining in mongodb");
        Job._agenda.jobs({name: jobName}, function(err, jobs) {
            if(isNull(err))
            {
                restartJobFunction(jobs);
            }
            else
            {
                Logger.log("error", "Error at fetchJobsStillInMongoAndRestartThem: " + JSON.stringify(err));
            }
        });
    }

    //INSTANCE METHODS
    constructor (name, jobData)
    {
        let self = this;
        self.jobData = jobData;
        self.name = name;
    }

    start (callback)
    {
        let self = this;
        Job._agenda.now(self.name, self.jobData, function (info) {
            callback(null);
        });
    }
}

module.exports.Job = Job;
