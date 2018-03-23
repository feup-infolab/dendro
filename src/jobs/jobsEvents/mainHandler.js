const Pathfinder = global.Pathfinder;
const path = require("path");
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

if(!isNull(Config.jobTypes) && Config.jobTypes.length) {
    //TODO add all job events handlers here
    require(Pathfinder.absPathInSrcFolder("/jobs/jobsEvents/importProjectHandler.js"));
}