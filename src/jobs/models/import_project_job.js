const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Job = require(Pathfinder.absPathInSrcFolder("/jobs/models/job.js")).Job;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

class ImportProjectJob extends Job
{
    constructor (jobData, handler)
    {
        super(jobData, handler);
        const self = this;
    }

    init ()
    {

    }

    start ()
    {

    }
}

module.exports.ImportProjectJob = ImportProjectJob;
