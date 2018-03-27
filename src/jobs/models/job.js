const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

class Job
{
    static _types = {};
    static _agenda;
    static _jobsStorageClient;

    static initDependencies ()
    {
        //TODO init _agenda and _jobsStorageClient
    }

    static fetchAndRestartJobsFromMongo ()
    {

    }

    constructor ()
    {
        if(isNull(Job._types[this.name]))
        {
            Job._types[this.name] = this;
        }
    }

    init ()
    {
        Job._agenda.define(this.name, this.handler);
    }
    start ()
    {
        Job._agenda.now(this.name, this.jobData);
    }
}

module.exports.Job = Job;
