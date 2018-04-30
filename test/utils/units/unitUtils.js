const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;
const VirtualBoxManager = require(Pathfinder.absPathInSrcFolder("utils/virtualbox/vm_manager.js")).VirtualBoxManager;
const _ = require("underscore");
const async = require("async");
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
    let originalFunc = Error.prepareStackTrace;

    let callerFile;
    try
    {
        let err = new Error();
        let currentfile;

        Error.prepareStackTrace = function (err, stack)
        {
            return stack;
        };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length)
        {
            callerFile = err.stack.shift().getFileName();

            if (currentfile !== callerFile) break;
        }
    }
    catch (e)
    {

    }

    Error.prepareStackTrace = originalFunc;

    return callerFile;
};

exports.getTopCallerUnitFile = function ()
{
    const bootupUnitClass = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let originalFunc = Error.prepareStackTrace;
    let mostSpecificClassFile;
    let mostSpecificClass;
    let callerFile;
    let callerClass;

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

exports.checkpointExists = function (checkpointIdentifier, callback)
{
    if (Config.docker.active)
    {
        callback(null, DockerCheckpointManager.checkpointExists(checkpointIdentifier));
    }
    else if (Config.virtualbox && Config.virtualbox.active)
    {
        VirtualBoxManager.checkpointExists(checkpointIdentifier, callback);
    }
    else
    {
        callback(null, false);
    }
};

exports.loadCheckpoint = function (checkpointIdentifier, callback)
{
    if (Config.docker.active || Config.virtualbox.active)
    {
        exports.checkpointExists(checkpointIdentifier, function (err, exists)
        {
            if (err)
            {
                throw new Error("Error checking if checkpoint " + checkpointIdentifier + " exists");
            }
            else
            {
                if (exists)
                {
                    if (Config.docker.active)
                    {
                        if (DockerCheckpointManager.restoreCheckpoint(checkpointIdentifier))
                        {
                            callback(null, checkpointIdentifier);
                        }
                        else
                        {
                            Logger.log("error", "Unable to find checkpoint with identifier: " + checkpointIdentifier);
                            callback(1, "Error restoring Docker Checkpoint " + checkpointIdentifier);
                        }
                    }
                    else if (Config.virtualbox && Config.virtualbox.active)
                    {
                        async.series([
                            function (callback)
                            {
                                if (!Config.virtualbox.reuseCheckpoints)
                                {
                                    Logger.log("Destroying VM checkpoint " + checkpointIdentifier + "...");
                                    VirtualBoxManager.destroySnapshot(checkpointIdentifier, function (err, result)
                                    {
                                        callback(err, result);
                                    }, true);
                                }
                                else
                                {
                                    callback(null);
                                }
                            },
                            function (callback)
                            {
                                VirtualBoxManager.restoreCheckpoint(checkpointIdentifier, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        callback(null, checkpointIdentifier);
                                    }
                                    else
                                    {
                                        Logger.log("error", err);
                                        Logger.log("error", result);
                                        callback(err, "Error occurred while restoring the snapshot of VM with identifier " + checkpointIdentifier);
                                    }
                                });
                            }
                        ]);
                    }
                }
                else
                {
                    callback(err, null);
                }
            }
        });
    }
    else
    {
        Logger.log("Neither Docker nor Virtualbox Configs active when trying to restore checkpoint " + checkpointIdentifier + ". Proceeeding...");
        callback(null);
    }
};

exports.loadLastSavedCheckpointInUnitHierarchy = function (callback)
{
    const bootupUnitClass = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let originalFunc = Error.prepareStackTrace;
    let lastCheckpointedUnitAbsolutePath;
    let currentCheckpointedUnit;
    let callerClass;
    let lastCheckpointClass;
    let currentFile;

    const getLastCheckpointedUnit = function (callback)
    {
        try
        {
            let err = new Error();

            Error.prepareStackTrace = function (err, stack)
            {
                return stack;
            };

            async.until(
                function ()
                {
                    return err.stack.length;
                },
                function (callback)
                {
                    currentFile = err.stack.shift().getFileName();
                    callerClass = require(currentFile);

                    if (bootupUnitClass.isPrototypeOf(callerClass) || bootupUnitClass === callerClass)
                    {
                        currentCheckpointedUnit = callerClass;

                        exports.checkpointExists(currentCheckpointedUnit.name, function (err, result)
                        {
                            lastCheckpointedUnitAbsolutePath = currentFile;
                            callback(err, lastCheckpointClass);
                        });
                    }
                },
                function (err, lastCheckpointClass)
                {
                    callback(err, lastCheckpointClass);
                }
            );
        }
        catch (e)
        {
            callback(e);
        }

        Error.prepareStackTrace = originalFunc;
    };

    getLastCheckpointedUnit(function (err, lastCheckpointedUnit)
    {
        if (!isNull(lastCheckpointedUnit))
        {
            const unitCheckpointIdentifier = lastCheckpointedUnit.name;
            if (exports.checkpointExists(unitCheckpointIdentifier))
            {
                exports.loadCheckpoint(unitCheckpointIdentifier, function (err, loadedUnit)
                {
                    if (!isNull(err))
                    {
                        callback(null, {
                            filename: lastCheckpointedUnit,
                            filePath: lastCheckpointedUnitAbsolutePath,
                            unit: lastCheckpointClass
                        });
                    }
                    else
                    {
                        callback(null, null);
                    }
                });
            }
            else
            {
                callback(null, null);
            }
        }
    });
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
                                }
                                else
                                {
                                    Logger.log("error", "Error halting app after loading databases for creating checkpoint: " + checkpointIdentifier);
                                }
                                cb(err);
                            });
                        }
                        else if (Config.virtualbox && Config.virtualbox.active)
                        {
                            Logger.log("Halting app after loading databases for creating checkpoint: " + checkpointIdentifier);

                            unit.shutdown(function (err, result)
                            {
                                if (!err)
                                {
                                    Logger.log("Halted app after loading databases for creating VM Snapshot: " + checkpointIdentifier);
                                    VirtualBoxManager.createCheckpoint(checkpointIdentifier, function (err, result)
                                    {
                                        cb(err, result);
                                    });
                                }
                                else
                                {
                                    Logger.log("error", "Error halting app after loading databases for creating VM Snapshot: " + checkpointIdentifier);
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
                cb(err, result);
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

exports.runAllLoadFunctionsUpUnitChain = function (targetUnit, callback)
{
    const async = require("async");
    const bootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let unitsToRun = [];

    let currentUnit = targetUnit;

    while (!isNull(currentUnit) && bootupUnit.isPrototypeOf(currentUnit))
    {
        unitsToRun.push(currentUnit);
        currentUnit = Object.getPrototypeOf(currentUnit);
    }

    unitsToRun.push(bootupUnit);

    unitsToRun = unitsToRun.reverse();

    async.mapSeries(unitsToRun, function (unit, cb)
    {
        unit.init(function (err, result)
        {
            if (isNull(err))
            {
                unit.load(function (err, result)
                {
                    if (isNull(err))
                    {
                        cb(null, result);
                    }
                    else
                    {
                        Logger.log("error", "Error running load function of unit " + unit.name);
                        Logger.log("error", err);
                        Logger.log("error", result);
                        cb(err, result);
                    }
                });
            }
            else
            {
                Logger.log("error", "Error running load function of unit: " + targetUnit.name);
                Logger.log("error", err);
                Logger.log("error", result);
                cb(err, result);
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
    const dendroInstance = new App();

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
                    Logger.log("error", "Error starting Dendro App!");
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

exports.setup = function (targetUnit, callback, forceLoad)
{
    const checkpointIdentifier = targetUnit.name;
    const tryToRestoreUnitState = function (callback)
    {
        if (Config.docker.active)
        {
            if (!Config.docker.reuse_checkpoints)
            {
                DockerCheckpointManager.deleteAll(true, true);
                DockerCheckpointManager.nukeAndRebuild(true);
            }

            Logger.log("Trying to recover checkpoint " + checkpointIdentifier + "...");
            exports.loadCheckpoint(checkpointIdentifier, function (err, result)
            {
                callback(err, result);
            });
        }
        else if (Config.virtualbox && Config.virtualbox.active)
        {
            exports.loadCheckpoint(checkpointIdentifier, function (err, result)
            {
                callback(err, result);
            });
        }
        else
        {
            callback(null);
        }
    };

    tryToRestoreUnitState(function (err, checkpointRestored)
    {
        if (!err)
        {
            if (checkpointRestored)
            {
                targetUnit.init(function (err, result)
                {
                    Logger.log("Ran only init function of " + targetUnit.name);
                    callback(err, result);
                });
            }
            else
            {
                if ((Config.docker.active || Config.virtualbox.active) && !forceLoad)
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
                                Logger.log("Ran load functions between " + startingUnit.name + " and " + targetUnit.name + " successfully");
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
                else
                {
                    exports.runAllLoadFunctionsUpUnitChain(targetUnit, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Ran all load functions until " + targetUnit.name + " successfully");

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
                            Logger.log("Error running functions until " + targetUnit.name + " !");
                            Logger.log("error", err);
                            Logger.log("error", JSON.stringify(result));
                            callback(err, result);
                        }
                    });
                }
            }
        }
        else
        {
            throw new Error("Unable to restore unit " + checkpointIdentifier + " state");
        }
    });
};

