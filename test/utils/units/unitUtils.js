const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;
const path = require("path");
const _ = require("underscore");

const setupStack = [];

exports.start = function (unitName, customMessage)
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        if (!customMessage)
        {
            console.log(("[Start] " + unitName + "...").green);
        }
        else
        {
            console.log(("[Start] " + unitName + ": " + customMessage).green);
        }
        exports.registerStartTimeForUnit(unitName);
    }
};

exports.end = function (unitName, customMessage)
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        if (!customMessage)
        {
            console.log(("[End] " + unitName + ".").yellow);
        }
        else
        {
            console.log(("[End] " + unitName + ": " + customMessage).yellow);
        }
        exports.registerStopTimeForUnit(unitName);
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

exports.getCallerFunctionFilePath = function ()
{
    var originalFunc = Error.prepareStackTrace;

    var callerfile;
    try
    {
        var err = new Error();
        var currentfile;

        Error.prepareStackTrace = function (err, stack)
        {
            return stack;
        };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length)
        {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) break;
        }
    }
    catch (e)
    {
    }

    Error.prepareStackTrace = originalFunc;

    return callerfile;
};


exports.getTopCallerUnit = function ()
{
    const bootupUnitClass = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let originalFunc = Error.prepareStackTrace;
    let mostSpecificClass;

    try
    {
        let err = new Error();

        Error.prepareStackTrace = function (err, stack)
        {
            return stack;
        };

        let currentFile = err.stack.shift().getFileName();
        mostSpecificClass = require(currentFile);

        while (err.stack.length)
        {
            callerFile = err.stack.shift().getFileName();
            callerClass = require(callerFile);

            if (bootupUnitClass.isPrototypeOf(callerClass))
            {
                mostSpecificClass = callerClass;
            }
        }
    }
    catch (e)
    {
    }

    Error.prepareStackTrace = originalFunc;

    return mostSpecificClass.name;
};

exports.startLoad = function ()
{
    const checkpointIdentifier = path.basename(exports.getCallerFunctionFilePath());

    if (!_.contains(setupStack, checkpointIdentifier))
    {
        setupStack.push(checkpointIdentifier);
    }

    exports.start(checkpointIdentifier, "Seeding database...");
};

exports.endLoad = function (unit, callback)
{
    const checkpointIdentifier = path.basename(exports.getCallerFunctionFilePath());

    if (Config.docker.active)
    {
        Logger.log("Halting app after loading databases for creating checkpoint: " + checkpointIdentifier);

        unit.shutdown(function (err, result)
        {
            if (!err)
            {
                Logger.log("Halted app after loading databases for creating checkpoint: " + checkpointIdentifier);
                exports.createCheckpoint(checkpointIdentifier);
                unit.init(function (err, result)
                {
                    callback(err, result);
                    exports.end(checkpointIdentifier, "Ended database seeding.");
                });
            }
            else
            {
                Logger.log("error", "Error halting app after loading databases for creating checkpoint: " + checkpointIdentifier);
                callback(err, result);
            }
        });
    }
    else
    {
        exports.end(checkpointIdentifier, "Ended database seeding.");
        callback(null);
    }
};

exports.createCheckpoint = function (customIdentifier)
{
    const self = this;
    if (!customIdentifier)
    {
        customIdentifier = self.name;
    }

    DockerCheckpointManager.createCheckpoint(customIdentifier);
};

exports.loadCheckpoint = function (customIdentifier)
{
    const self = this;
    if (!customIdentifier)
    {
        customIdentifier = self.name;
    }

    if (DockerCheckpointManager.restoreCheckpoint(customIdentifier))
    {
        return customIdentifier;
    }

    return false;
};

exports.setup = function (unit, callback)
{
    const loadedCheckpoint = exports.loadCheckpoint(unit.name);

    if (loadedCheckpoint)
    {
        Logger.log("Checkpoint " + loadedCheckpoint + "exists and was recovered.");
        unit.init(function (err, result)
        {
            Logger.log("Ran only init function of " + unit.name);
            callback(err, result);
        });
    }
    else
    {
        Logger.log("Checkpoint does not exist. Will load database...");
        unit.load(function (err, result)
        {
            if (isNull(err))
            {
                Logger.log("Ran load function of " + unit.name + " succesfully");
            }
            else
            {
                Logger.log("error", "Error running load function of " + unit.name + " successfully.");
                Logger.log("error", err);
                Logger.log("error", JSON.stringify(result));
            }
            callback(err);
        });
    }
};

