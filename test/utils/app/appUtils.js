const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const fs = require("fs");
const async = require("async");

const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;
const DockerManager = rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager;

// to try to cool down tests so that virtuoso does not clog up...
let numberofTestsRun = 0;

const runPeriodicFunctionsEveryXTests = function (callback)
{
    numberofTestsRun++;
    Logger.log("Ran " + numberofTestsRun + " test files.");

    async.series([
        function (cb)
        {
            if (Config.testing.apply_cooldown_every_x_tests > 0 && numberofTestsRun % Config.testing.apply_cooldown_every_x_tests === 0)
            {
                Logger.log("Waiting " + Config.testing.cooldown_secs + " seconds to allow databases to cooldown.");
                const sleep = require("sleep");
                sleep.sleep(Config.testing.cooldown_secs);
            }
            cb(null);
        },
        function (cb)
        {
            if (Config.docker.active && Config.docker.restart_containers_every_x_tests > 0 && numberofTestsRun % Config.docker.restart_containers_every_x_tests === 0)
            {
                Logger.log("Restarting containers because " + Config.testing.restart_containers_every_x_tests + " tests have been run!");
                DockerManager.restartContainers(cb);
            }
            else
            {
                cb(null);
            }
        }
    ], function (err, results)
    {
        callback(err, results);
    });
};

exports.requireUncached = function (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
};

exports.clearAppState = function (cb)
{
    if (!global.tests.server)
    {
        return cb(1, "Server did not start successfully");
    }

    exports.saveRouteLogsToFile(function (err, info)
    {
        const dendroInstance = global.tests.dendroInstance;
        dendroInstance.freeResources(function (err, results)
        {
            delete global.tests.app;
            delete global.tests.server;
            delete global.tests.dendroInstance;
            runPeriodicFunctionsEveryXTests(function (err)
            {
                if (err)
                {
                    Logger.log("error", "Error occurred while applying cooldown to tests!");
                }
                cb(err, results);
            });
        });
    });
};

exports.resource_id_uuid_regex = function (resourceType)
{
    const regex = "^/r/" + resourceType + "/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);
};

exports.newTestRouteLog = function (routeName)
{
    if (isNull(routeName))
    {
        const msg = "Error at newTestRouteLog: Argument routeName is REQUIRED";
        return msg;
    }
    global.testingRoute = routeName;
    if (isNull(global.routesLog))
    {
        global.routesLog = {};
    }
    let newRouteLog = {
        routeName: routeName,
        unitsData: {}
    };
    global.routesLog[routeName] = newRouteLog;
    return global.routesLog;
};

exports.saveRouteLogsToFile = function (callback)
{
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = "Error at saveRouteLogsToFile: global.testingRoute and global.routesLog were not properly initialized";
        delete global.testingRoute;
        delete global.routesLog;
        callback(null, msg);
    }
    else
    {
        const filePath = rlequire.absPathInApp("dendro", "test/logs/" + global.testingRoute + "_" + Date.now() + ".json");

        mkdirp(getDirName(filePath), function (err)
        {
            if (err)
            {
                delete global.testingRoute;
                delete global.routesLog;
                callback(err, err);
            }
            else
            {
                fs.writeFile(filePath, JSON.stringify(global.routesLog, null, 4), function (err)
                {
                    delete global.testingRoute;
                    delete global.routesLog;
                    callback(err, err);
                });
            }
        });
    }
};

exports.printRoutesLog = function (routesLog)
{
    if (isNull(routesLog))
    {
        Logger.log("error", "ERROR: CANNOT PRINT ROUTES LOG. UNITS LOG IS NULL");
    }
    else
    {
        console.log("-------ROUTES LOG-------");
        console.log(JSON.stringify(routesLog));
    }
};

module.exports = exports;
