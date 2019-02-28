const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null").isNull;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const DockerManager = rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager;
const VirtualBoxManager = rlequire("dendro", "src/utils/virtualbox/vm_manager.js").VirtualBoxManager;
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

exports.getTopMinusOneCallerUnit = function ()
{
    const bootupUnitClass = rlequire("dendro", "test/units/bootup.Unit.js");
    let originalFunc = Error.prepareStackTrace;
    let mostSpecificClassFile;
    let mostSpecificClass = null;

    let mostSpecificClassFileMinusOne;
    let mostSpecificClassMinusOne = null;

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
                if (!isNull(mostSpecificClass))
                {
                    mostSpecificClassMinusOne = mostSpecificClass;
                    mostSpecificClassFileMinusOne = mostSpecificClassFile;
                }

                mostSpecificClass = callerClass;
                mostSpecificClassFile = callerFile;
            }
        }
    }
    catch (e)
    {
    }

    Error.prepareStackTrace = originalFunc;

    return mostSpecificClassMinusOne;
};

exports.getTopCallerUnitFile = function ()
{
    const bootupUnitClass = rlequire("dendro", "test/units/bootup.Unit.js");
    let originalFunc = Error.prepareStackTrace;
    let mostSpecificClassFile;
    let mostSpecificClass = null;
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
        DockerManager.checkpointExists(checkpointIdentifier, function (err, exists)
        {
            callback(err, exists);
        });
    }
    else
    {
        callback(null, false);
    }
};

exports.restoreCheckpoint = function (checkpointIdentifier, callback)
{
    if (Config.docker.active)
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
                    if (Config.docker.active && Config.docker.reuse_checkpoints)
                    {
                        DockerManager.restoreCheckpoint(checkpointIdentifier, function (err, restoredCheckpoint)
                        {
                            callback(err, restoredCheckpoint);
                        });
                    }
                    else
                    {
                        callback(err, false);
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
        Logger.log("Docker not active when trying to restore checkpoint " + checkpointIdentifier + ". Proceeeding...");
        callback(null);
    }
};

exports.loadLastSavedCheckpointInUnitHierarchy = function (targetUnit, callback)
{
    const bootupUnitClass = rlequire("dendro", "test/units/bootup.Unit.js");

    const getLastCheckpointedUnit = function (callback)
    {
        try
        {
            let currentUnit = targetUnit;
            let lastCheckpointedUnit;

            async.doUntil(
                function (callback)
                {
                    if (bootupUnitClass.isPrototypeOf(currentUnit) || bootupUnitClass === currentUnit)
                    {
                        exports.checkpointExists(currentUnit.name, function (err, checkpointExists)
                        {
                            if (checkpointExists)
                            {
                                lastCheckpointedUnit = currentUnit;
                            }

                            callback(err, currentUnit);
                        });
                    }
                    else
                    {
                        callback(null, currentUnit);
                    }
                },
                function (lastCheckedUnit)
                {
                    let checkValue;
                    // Logger.log(lastCheckedUnit.name);
                    if (!isNull(lastCheckpointedUnit))
                    {
                        return true;
                    }

                    if (isNull(Object.getPrototypeOf(lastCheckedUnit)))
                    {
                        checkValue = true;
                    }
                    else
                    {
                        checkValue = false;
                    }

                    currentUnit = Object.getPrototypeOf(lastCheckedUnit);
                    return checkValue;
                },
                function (err)
                {
                    callback(err, lastCheckpointedUnit);
                }
            );
        }
        catch (e)
        {
            callback(null);
        }
    };

    getLastCheckpointedUnit(function (err, lastCheckpointedUnit)
    {
        if (isNull(err))
        {
            if (!isNull(lastCheckpointedUnit))
            {
                const unitCheckpointIdentifier = lastCheckpointedUnit.name;
                exports.restoreCheckpoint(unitCheckpointIdentifier, function (err, loadedUnit)
                {
                    if (!isNull(err))
                    {
                        callback(null, lastCheckpointedUnit);
                    }
                    else
                    {
                        callback(err, lastCheckpointedUnit);
                    }
                });
            }
            else
            {
                callback(null, null);
            }
        }
        else
        {
            callback(err, lastCheckpointedUnit);
        }
    });
};

exports.createCheckpointForUnit = function (unit, callback)
{
    const checkpointIdentifier = unit.name;
    if (Config.docker.active && Config.docker.active && Config.docker.create_checkpoints)
    {
        Logger.log("Halting app after loading databases for creating checkpoint: " + checkpointIdentifier);

        unit.shutdown(function (err, result)
        {
            if (!err)
            {
                Logger.log("Halted app after loading databases for creating checkpoint: " + checkpointIdentifier);
                DockerManager.createCheckpoint(checkpointIdentifier, function (err, result)
                {
                    callback(err, result);
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
        callback(null);
    }
};

exports.runLoadFunctionsFromExistingCheckpointUntilUnit = function (checkpointedUnit, targetUnit, callback)
{
    const async = require("async");
    const bootupUnit = rlequire("dendro", "test/units/bootup.Unit.js");
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
        unit.init(function (err, result)
        {
            if (isNull(err))
            {
                unit.load(function (err, result)
                {
                    if (isNull(err))
                    {
                        exports.createCheckpointForUnit(unit, function (err, result)
                        {
                            cb(err, result);
                        });
                    }
                    else
                    {
                        cb(err, result);
                    }
                });
            }
            else
            {
                Logger.log("error", "Error starting app for loading databases for creating checkpoint: " + unit.name);
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
    const bootupUnit = rlequire("dendro", "test/units/bootup.Unit.js");
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
    const App = rlequire("dendro", "src/bootup/app.js").App;
    const dendroInstance = new App();

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
};

exports.setup = function (targetUnit, callback, forceLoad)
{
    const checkpointIdentifier = targetUnit.name;
    const tryToRestoreUnitState = function (callback)
    {
        if (Config.docker.active)
        {
            const fetchAllImages = function (callback)
            {
                DockerManager.fetchAllOrchestras(callback, true);
            };

            const restoreState = function (callback)
            {
                Logger.log("Trying to recover checkpoint " + checkpointIdentifier + "...");

                if (Config.docker.reuse_checkpoints && !forceLoad)
                {
                    exports.restoreCheckpoint(checkpointIdentifier, function (err, result)
                    {
                        callback(err, !!result);
                    }, !forceLoad);
                }
                else
                {
                    callback(null, null);
                }
            };

            if (Config.docker.destroy_existing_images_at_start)
            {
                DockerManager.destroyAllOrchestras(function (err)
                {
                    if (isNull(err))
                    {
                        fetchAllImages(function ()
                        {
                            restoreState(callback);
                        });
                    }
                    else
                    {
                        callback(1, "Error nuking docker before restoring state " + checkpointIdentifier);
                    }
                }, true);
            }
            else
            {
                fetchAllImages(function ()
                {
                    restoreState(callback);
                });
            }
        }
        else
        {
            callback(null);
        }
    };

    const runAllLoadFunctions = function (callback)
    {
        exports.runAllLoadFunctionsUpUnitChain(targetUnit, function (err, result)
        {
            if (isNull(err))
            {
                Logger.log("Ran all load functions until " + targetUnit.name + " successfully");

                exports.createCheckpointForUnit(targetUnit, function (err, result)
                {
                    if (isNull(err))
                    {
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
                        Logger.log("error", "Error creating checkpoint for unit " + targetUnit.name + " !");
                        Logger.log("error", err);
                        Logger.log("error", result);
                        callback(err, result);
                    }
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
    };

    if (forceLoad)
    {
        runAllLoadFunctions(callback);
    }
    else
    {
        tryToRestoreUnitState(function (err, checkpointRestored)
        {
            if (!err)
            {
                if (checkpointRestored)
                {
                    targetUnit.init(function (err, result)
                    {
                        Logger.log("Ran only init function of " + targetUnit.name + " because the state was restored from an existing checkpoint.");
                        callback(err, result);
                    });
                }
                else
                {
                    if (Config.docker.active && Config.docker.reuse_checkpoints)
                    {
                        Logger.log("Final checkpoint " + checkpointIdentifier + " does not exist. Will try to load the last checkpoint up the unit dependency chain...");
                        exports.loadLastSavedCheckpointInUnitHierarchy(targetUnit, function (err, loadedUnit)
                        {
                            if (isNull(err))
                            {
                                let startingUnit;
                                if (!isNull(loadedUnit))
                                {
                                    Logger.log("Loaded " + loadedUnit.name + ", will now run load remaining functions up the unit dependency chain...");
                                }

                                exports.runLoadFunctionsFromExistingCheckpointUntilUnit(loadedUnit, targetUnit, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        if (startingUnit)
                                        {
                                            Logger.log("Ran load functions between " + loadedUnit.name + " and " + targetUnit.name + " successfully");
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
                                        if (!isNull(loadedUnit))
                                        {
                                            Logger.log("Error running functions between " + loadedUnit.name + " and " + targetUnit.name + " !");
                                        }
                                        else
                                        {
                                            Logger.log("Error running functions from the root until " + targetUnit.name + " !");
                                        }

                                        Logger.log("error", err);
                                        Logger.log("error", JSON.stringify(result));
                                        callback(err, result);
                                    }
                                });
                            }
                            else
                            {
                                throw new Error("Unable to load last checkpoint unit " + checkpointIdentifier + " state");
                            }
                        });
                    }
                    else
                    {
                        runAllLoadFunctions(callback);
                    }
                }
            }
            else
            {
                throw new Error("Unable to restore unit " + checkpointIdentifier + " state");
            }
        });
    }
};

