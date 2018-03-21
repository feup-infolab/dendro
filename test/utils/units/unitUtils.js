const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;
const path = require("path");
const _ = require("underscore");
const chai = require("chai");

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

exports.getTopCallerUnitFile = function ()
{
    const bootupUnitClass = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let originalFunc = Error.prepareStackTrace;
    let mostSpecificClassFile;

    try
    {
        let err = new Error();

        Error.prepareStackTrace = function (err, stack)
        {
            return stack;
        };

        let currentFile = err.stack.shift().getFileName();
        mostSpecificClass = require(currentFile);
        mostSpecificClassFile = currentFile;

        while (err.stack.length)
        {
            callerFile = err.stack.shift().getFileName();
            callerClass = require(callerFile);

            if (bootupUnitClass.isPrototypeOf(callerClass))
            {
                mostSpecificClass = callerClass;
                mostSpecificClassFile = callerFile;
            }
        }
    }
    catch (e)
    {
    }

    Error.prepareStackTrace = originalFunc;

    return mostSpecificClassFile;
};

exports.startLoad = function (unit)
{
    const checkpointIdentifier = unit.name;
    exports.start(checkpointIdentifier, "Seeding database...");
};

exports.endLoad = function (unit, callback)
{
    const checkpointIdentifier = unit.name;
    exports.end(checkpointIdentifier, "Ended database seeding.");
    callback(null);
};

exports.loadCheckpoint = function (checkpointIdentifier)
{
    if (DockerCheckpointManager.restoreCheckpoint(checkpointIdentifier))
    {
        return checkpointIdentifier;
    }

    throw new Error("Unable to find checkpoint with identifier: " + checkpointIdentifier);
};

exports.checkpointExists = function (checkpointIdentifier)
{
    return DockerCheckpointManager.checkpointExists(checkpointIdentifier);
};

exports.loadLastSavedCheckpointInUnitHierarchy = function ()
{
    const bootupUnitClass = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let originalFunc = Error.prepareStackTrace;
    let lastCheckpointedUnit;
    let lastCheckpointedUnitAbsolutePath;
    let currentCheckpointedUnit;
    let callerClass;
    let lastCheckpointClass;

    try
    {
        let err = new Error();

        Error.prepareStackTrace = function (err, stack)
        {
            return stack;
        };

        while (err.stack.length)
        {
            currentFile = err.stack.shift().getFileName();
            callerClass = require(currentFile);

            if (bootupUnitClass.isPrototypeOf(callerClass) || bootupUnitClass === callerClass)
            {
                currentCheckpointedUnit = callerClass;
                if (DockerCheckpointManager.checkpointExists(currentCheckpointedUnit.name))
                {
                    lastCheckpointedUnit = currentCheckpointedUnit;
                    lastCheckpointedUnitAbsolutePath = currentFile;
                    lastCheckpointClass = callerClass;
                }
            }
        }
    }
    catch (e)
    {
    }

    Error.prepareStackTrace = originalFunc;
    const unitCheckpointIdentifier = lastCheckpointedUnit.name;

    if (!isNull(lastCheckpointedUnit) && exports.checkpointExists(unitCheckpointIdentifier))
    {
        const loadedUnit = exports.loadCheckpoint(unitCheckpointIdentifier);

        if (!isNull(loadedUnit))
        {
            return {
                filename: lastCheckpointedUnit,
                filePath: lastCheckpointedUnitAbsolutePath,
                unit: lastCheckpointClass
            };
        }

        return null;
    }

    return null;
};

exports.runLoadFunctionsFromExistingCheckpointUntilUnit = function (checkpointedUnit, targetUnit, callback)
{
    const async = require("async");
    const bootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let unitsToRun = [];

    let currentUnit = targetUnit;

    while (!isNull(currentUnit) && bootupUnit.isPrototypeOf(currentUnit) && currentUnit !== checkpointedUnit)
    {
        unitsToRun.push(currentUnit);
        currentUnit = Object.getPrototypeOf(currentUnit);
    }

    if (isNull(checkpointedUnit))
    {
        unitsToRun.push(bootupUnit);
    }

    unitsToRun = unitsToRun.reverse();

    async.mapSeries(unitsToRun, function (unit, cb)
    {
        const checkpointIdentifier = unit.name;
        unit.init(function (err, result)
        {
            if (isNull(err))
            {
                unit.load(function (err, result)
                {
                    if (isNull(err))
                    {
                        if (Config.docker.active)
                        {
                            Logger.log("Halting app after loading databases for creating checkpoint: " + checkpointIdentifier);

                            unit.shutdown(function (err, result)
                            {
                                if (!err)
                                {
                                    Logger.log("Halted app after loading databases for creating checkpoint: " + checkpointIdentifier);
                                    DockerCheckpointManager.createCheckpoint(checkpointIdentifier);
                                    cb(err, result);
                                }
                                else
                                {
                                    Logger.log("error", "Error halting app after loading databases for creating checkpoint: " + checkpointIdentifier);
                                    cb(err, result);
                                }
                            });
                        }
                        else
                        {
                            cb(null);
                        }
                    }
                    else
                    {
                        cb(err, result);
                    }
                });
            }
            else
            {
                Logger.log("error", "Error starting app for loading databases for creating checkpoint: " + checkpointIdentifier);
            }
        });
    }, function (err, results)
    {
        if (isNull(err))
        {
            callback(err, targetUnit);
        }
        else
        {
            callback(err, results);
        }
    });
};

exports.shutdown = function (callback)
{
    Logger.log("debug", "Starting server shutdown.");
    const dendroInstance = global.tests.dendroInstance;
    dendroInstance.freeResources(function (err, result)
    {
        global.tests.app = null;
        Logger.log("debug", "Server shutdown complete.");
        callback(err);
    });
};

exports.init = function (callback)
{
    const App = require(Pathfinder.absPathInSrcFolder("bootup/app.js")).App;
    dendroInstance = new App();

    if (Config.docker.active)
    {
        if (!Config.docker.reuse_checkpoints)
        {
            DockerCheckpointManager.deleteAll(true, true);
            DockerCheckpointManager.nukeAndRebuild(true);
        }
    }

    dendroInstance.initConnections(function (err, appInfo)
    {
        if (isNull(err))
        {
            dendroInstance.startApp(function (err, appInfo)
            {
                if (isNull(err))
                {
                    chai.request(appInfo.app)
                        .get("/")
                        .end((err, res) =>
                        {
                            global.tests.app = appInfo.app;
                            global.tests.dendroInstance = dendroInstance;
                            global.tests.server = appInfo.server;
                            callback(err, res);
                        });
                }
                else
                {
                    Logger.log("error", "Error seeding databases!");
                    Logger.log("error", JSON.stringify(err));
                    callback(err);
                }
            });
        }
        else
        {
            Logger.log("error", "Error initializing connections between dendro and database servers!");
            Logger.log("error", JSON.stringify(err));
            callback(err);
        }
    });
};

exports.setup = function (targetUnit, callback)
{
    const checkpointIdentifier = targetUnit.name;
    if (exports.checkpointExists(checkpointIdentifier))
    {
        Logger.log("Checkpoint \"" + checkpointIdentifier + "\" exists. Recovering...");
        exports.loadCheckpoint(checkpointIdentifier);
        targetUnit.init(function (err, result)
        {
            Logger.log("Ran only init function of " + targetUnit.name);
            callback(err, result);
        });
    }
    else
    {
        Logger.log("Final checkpoint " + checkpointIdentifier + " does not exist. Will try to load the last checkpoint up the unit dependency chain...");
        const loadedCheckpointInfo = exports.loadLastSavedCheckpointInUnitHierarchy();
        let startingUnit;
        if (!isNull(loadedCheckpointInfo))
        {
            Logger.log("Loaded " + loadedCheckpointInfo.unit.name + ", will now run load remaining functions up the unit dependency chain...");
            startingUnit = loadedCheckpointInfo.unit;
        }
        else
        {
            startingUnit = null;
        }

        exports.runLoadFunctionsFromExistingCheckpointUntilUnit(startingUnit, targetUnit, function (err, result)
        {
            if (isNull(err))
            {
                if (startingUnit)
                {
                    Logger.log("Ran load functions between " + startingUnit + " and " + targetUnit.name + " successfully");
                }
                else
                {
                    Logger.log("Ran all load functions until " + targetUnit.name + " successfully");
                }

                exports.init(function (err, result)
                {
                    if (!err)
                    {
                        Logger.log("Started dendro instance successfully!");
                    }
                    else
                    {
                        Logger.log("error", "Error starting dendro instance");
                        Logger.log("error", err);
                        Logger.log("error", result);
                    }
                    callback(err, result);
                });
            }
            else
            {
                Logger.log("Error running functions between " + startingUnit + " and " + targetUnit.name + " !");
                Logger.log("error", err);
                Logger.log("error", JSON.stringify(result));
                callback(err, result);
            }
        });
    }
};

