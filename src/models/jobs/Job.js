const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Agenda = require("agenda");
const fs = require("fs");
const slug = rlequire("dendro", "src/utils/slugifier.js");

class Job
{
    // STATIC METHODS
    static initDependencies (callback)
    {
        Job._jobTypes = [];
        Job._agenda = null;
        Job._jobsStorageClient = null;
        const initAgenda = function (callback)
        {
            const jobsFolder = rlequire.absPathInApp("dendro", "src/models/jobs/subtypes");

            fs.readdir(jobsFolder, (err, files) =>
            {
                if (!isNull(err))
                {
                    return callback(err, files);
                }

                const mongoDBJobCollectionDBName = slug(Config.mongoJobCollectionName, "_");

                let url;
                if (Config.mongoDBAuth.username && Config.mongoDBAuth.password && Config.mongoDBAuth.password !== "" && Config.mongoDBAuth.username !== "")
                {
                    // + "?authSource=admin";
                    url = "mongodb://" + Config.mongoDBAuth.username + ":" + Config.mongoDBAuth.password + "@" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBJobCollectionDBName + "?authSource=admin";
                    Logger.log("debug", "Connecting to MongoDB Jobs Collection using connection string: " + "mongodb://" + Config.mongoDBAuth.username + ":" + "PASSWORD" + "@" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBJobCollectionDBName + "?authSource=admin");
                }
                else
                {
                    url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBJobCollectionDBName;
                    Logger.log("debug", "Connecting to GridFS Jobs Collection using connection string: " + url);
                }

                try
                {
                    let agenda = new Agenda({
                        db: {
                            address: url
                        },
                        maxConcurrency: 1
                    });

                    agenda.on("error", function (error)
                    {
                        if (error.message === "Lost MongoDB connection" && Job.disconnectErrors < 15)
                        {
                            Logger.log("debug", "Mongodb Connnection of Agenda was lost, will attempt a reconnect...");
                            Job.disconnectErrors++;
                        }
                        else
                        {
                            throw error;
                        }
                    });

                    Job._agenda = agenda;
                }
                catch (error)
                {
                    const errorMsg = "Error connecting to MongoDB Jobs storage, error: " + JSON.stringify(error);
                    Logger.log("error", errorMsg);
                    return callback(errorMsg);
                }

                Job._jobTypes = [];

                files.forEach(function (type)
                {
                    const path = require("path");
                    const jobTypeFileName = path.basename(type, ".js");
                    let jobType = rlequire("dendro", "src/models/jobs/subtypes/" + jobTypeFileName)[jobTypeFileName];
                    Job._jobTypes.push(jobType);
                    jobType.defineJob();
                    jobType.registerJobEvents();
                });

                callback(null);
            });
        };

        initAgenda(function (err)
        {
            if (isNull(err))
            {
                Logger.log("debug", "Job dependencies are now set!");
                callback(null);
            }
            else
            {
                Logger.log("error", "Job dependencies Agenda error: " + JSON.stringify(err));
                callback(err);
            }
        });
    }

    static registerJobEvents (jobName, successHandlerFunction, errorHandlerFunction)
    {
        Job._agenda.on("success:" + jobName, function (job)
        {
            Job.disconnectErrors = 0;
            successHandlerFunction(job);
        });

        Job._agenda.on("fail:" + jobName, function (err, job)
        {
            errorHandlerFunction(job);
        });
    }

    static defineJob (jobName, jobDefinitionFunction)
    {
        Job._agenda.define(jobName, function (job, done)
        {
            jobDefinitionFunction(job, done);
        });
    }

    static startJobs (jobName, restartJobFunction)
    {
        const self = this;
        if (self.isSingleton)
        {
            if (!self.alreadyRunning)
            {
                let singletonJob = new self.prototype.constructor({});

                if (self.cronExpression)
                {
                    singletonJob.repeatEvery(self.cronExpression, function (err)
                    {
                        if (isNull(err))
                        {
                            Logger.log("info", "Job " + self.name + " running...");
                            self.alreadyRunning = true;
                        }
                        else
                        {
                            self.alreadyRunning = false;
                            const msg = "Job " + self.name + " failed to start!";
                            Logger.log("error", msg);
                            throw new Error(msg);
                        }
                    });
                }
                else{
                    singletonJob.start(function (err) {
                        if (isNull(err))
                        {
                            Logger.log("info", "Job " + self.name + " running...");
                            self.alreadyRunning = true;
                        }
                        else
                        {
                            self.alreadyRunning = false;
                            const msg = "Job " + self.name + " failed to start!";
                            Logger.log("error", msg);
                            throw new Error(msg);
                        }
                    });
                }
            }
        }
        else
        {
            Logger.log("info", "Attempting to restart any " + jobName + " remaining in mongodb");
            Job._agenda.jobs({name: jobName}, function (err, jobs)
            {
                if (isNull(err))
                {
                    restartJobFunction(jobs);
                }
                else
                {
                    Logger.log("error", "Error at startJobs: " + JSON.stringify(err));
                }
            });
        }
    }

    // INSTANCE METHODS
    constructor (name, jobData)
    {
        let self = this;
        self.jobData = jobData;
        self.name = name;
    }

    start (callback)
    {
        let self = this;
        Job._agenda.now(self.name, self.jobData, function (info)
        {
            callback(null);
        });
    }

    repeatEvery (cronExpression, callback)
    {
        let self = this;
        Job._agenda.every(cronExpression, self.name, function (info)
        {
            callback(null);
        });
    }

    static stopAgenda (callback)
    {
        if (!isNull(Job._agenda))
        {
            Job._agenda.stop(function (err, result)
            {
                // TODO
                // Force connection to DIE DIE DIE otherwise it is dropped!
                Job._agenda._mdb.close(true, function (err, result)
                {
                    delete Job._agenda;
                    callback(err, result);
                });
            });
        }
        else
        {
            callback(null);
        }
    }
}

module.exports.Job = Job;
