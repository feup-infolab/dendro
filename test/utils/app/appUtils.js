const Pathfinder = require("../../../src/models/meta/pathfinder").Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const fs = require("fs");
const async = require("async");

const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;

// to try to cool down tests so that virtuoso does not clog up.
let numberofTestsRun = 0;
// 10 sec cooldown every 7 test files
const testsBatchSizeBeforeCooldown = 7;
const testsCooldownTime = 10;
const testsBetweenVirtualboxRestarts = 20;

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const applyCooldownToTests = function (callback)
{
    numberofTestsRun++;
    Logger.log("Ran " + numberofTestsRun + " test files.");

    async.series([
        function (cb)
        {
            if (numberofTestsRun % testsBatchSizeBeforeCooldown === 0)
            {
                Logger.log("Waiting " + testsCooldownTime + " seconds to allow databases to cooldown.");
                const sleep = require("sleep");
                sleep.sleep(testsCooldownTime);
            }
            cb(null);
        },
        function (cb)
        {
            if (numberofTestsRun % testsBetweenVirtualboxRestarts === 0 && Config.virtualbox.active)
            {
                Logger.log("Restarting Virtual Machine " + Config.virtualbox.vmName);
                const VirtualBoxManager = require(Pathfinder.absPathInSrcFolder("utils/virtualbox/vm_manager.js")).VirtualBoxManager;
                VirtualBoxManager.restartVM(false, cb);
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

    appUtils.saveRouteLogsToFile(function (err, info)
    {
        applyCooldownToTests(function (err)
        {
            if (err)
            {
                Logger.log("error", "Error occurred while applying cooldown to tests!");
            }
            const dendroInstance = global.tests.dendroInstance;
            dendroInstance.freeResources(function (err, results)
            {
                delete global.tests.app;
                delete global.tests.server;
                delete global.tests.dendroInstance;
                cb(err, results);
            });
        });
    });
};

exports.resource_id_uuid_regex = function (resource_type)
{
    const regex = "^/r/" + resource_type + "/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
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
        const filePath = Pathfinder.absPathInTestsFolder("logs/") + global.testingRoute + "_" + Date.now() + ".json";

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

const printRoutesLog = function (routesLog)
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
