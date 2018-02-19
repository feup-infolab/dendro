const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const path = require("path");

exports.start = function (unitFilePath, customMessage)
{
    unitFilePath = path.basename(unitFilePath);
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        if (!customMessage)
        {
            console.log(("[Start] " + unitFilePath + "...").green);
        }
        else
        {
            console.log(("[Start] " + unitFilePath + ": " + customMessage).green);
        }
        exports.registerStartTimeForUnit(unitFilePath);
    }
};

exports.end = function (unitFilePath, customMessage)
{
    unitFilePath = path.basename(unitFilePath);
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        if (!customMessage)
        {
            console.log(("[End] " + unitFilePath + ".").yellow);
        }
        else
        {
            console.log(("[End] " + unitFilePath + ": " + customMessage).yellow);
        }
        exports.registerStopTimeForUnit(unitFilePath);
    }
};

exports.registerStartTimeForUnit = function (unitName)
{
    if (isNull(unitName))
    {
        const msg = "Error at registerStartTimeForUnit: Argument unitName is REQUIRED";
        return msg;
    }
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = "Error at registerStartTimeForUnit: newTestRouteLog was not properly initialized";
        return msg;
    }
    const timeMilliseconds = Date.now();
    if (isNull(global.routesLog[global.testingRoute].unitsData))
    {
        global.routesLog[global.testingRoute].unitsData = {};
    }
    let unit = {
        name: unitName,
        startTime: timeMilliseconds
    };

    global.routesLog[global.testingRoute].unitsData[unitName] = unit;
    return global.routesLog;
};

exports.registerStopTimeForUnit = function (unitName)
{
    if (isNull(unitName))
    {
        const msg = "Error at registerStopTimeForUnit: Argument unitName is REQUIRED";
        return msg;
    }
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = "Error at registerStopTimeForUnit: newTestRouteLog was not properly initialized";
        return msg;
    }
    if (isNull(global.routesLog[global.testingRoute].unitsData[unitName]) || isNull(global.routesLog[global.testingRoute].unitsData[unitName].startTime))
    {
        const msg = "Error at registerStopTimeForUnit: unit: " + unitName + "was not properly initialized at registerStartTimeForUnit";
        return msg;
    }
    const timeMilliseconds = Date.now();
    global.routesLog[global.testingRoute].unitsData[unitName].stopTime = timeMilliseconds;
    // https://github.com/moment/moment/issues/1048
    let duration = moment.duration(timeMilliseconds - global.routesLog[global.testingRoute].unitsData[unitName].startTime);
    let delta = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
    /* let delta = moment.duration(timeMilliseconds - global.routesLog[global.testingRoute].unitsData[unitName].startTime, "milliseconds").humanize(); */
    global.routesLog[global.testingRoute].unitsData[unitName].delta = delta;
    /* printRoutesLog(global.routesLog); */
    return global.routesLog;
};

exports.loadCheckpoint = function (checkpointName)
{
    let checkpointExists = false;
    let checkpointLoaded = false;

    if (Config.docker.active)
    {
        checkpointExists = DockerCheckpointManager.checkpointExists(checkpointName);

        if (checkpointExists)
        {
            try
            {
                checkpointLoaded = DockerCheckpointManager.restoreCheckpoint(checkpointName);
            }
            catch (e)
            {
                throw e;
            }
        }
        else
        {
            const msg = "Checkpoint " + checkpointName + " does not exist.";
            Logger.log("info", msg);
        }
    }

    return checkpointLoaded;
};
