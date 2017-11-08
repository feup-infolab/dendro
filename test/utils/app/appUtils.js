const Pathfinder = require('../../../src/models/meta/pathfinder').Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const async = require('async');
const jsonfile = require('jsonfile');
const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;

const db = require(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));
const index = require(Pathfinder.absPathInTestsFolder('utils/index/index.Test.js'));

const chai = require('chai');
const fs = require('fs');
const should = chai.should();
const moment = require('moment');

const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

// to try to cool down tests so that virtuoso does not clog up.
let numberofTestsRun = 0;
// 10 sec cooldown every 7 test files
const testsBatchSizeBeforeCooldown = 7;
const testsCooldownTime = 10;

const applyCooldownToTests = function ()
{
    numberofTestsRun++;
    console.log('Ran ' + numberofTestsRun + ' test files.');
    return;

    if (numberofTestsRun % testsBatchSizeBeforeCooldown === 0)
    {
        console.log('Ran ' + numberofTestsRun + ' test files. Waiting ' + testsCooldownTime + ' seconds to allow databases to cooldown.');
        const sleep = require('sleep');
        sleep.sleep(testsCooldownTime);
    }
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
        return cb(1, 'Server did not start successfully');
    }
    saveRouteLogsToFile(function (err, info)
    {
        applyCooldownToTests();
        global.tests.app.freeResources(function (err, results)
        {
            setTimeout(function ()
            {
                delete global.tests.app;
                delete global.tests.server;
                return cb(err, results);
            }, 1000);

            // delete global.tests.app;
            // delete global.tests.server;
            // return cb(err, results);
        });
    });
};

exports.resource_id_uuid_regex = function (resource_type)
{
    const regex = '^/r/' + resource_type + '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
    return new RegExp(regex);
};

exports.newTestRouteLog = function (routeName)
{
    if (isNull(routeName))
    {
        const msg = 'Error at newTestRouteLog: Argument routeName is REQUIRED';
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

const saveRouteLogsToFile = function (callback)
{
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = 'Error at saveRouteLogsToFile: global.testingRoute and global.routesLog were not properly initialized';
        delete global.testingRoute;
        delete global.routesLog;
        callback(null, msg);
    }
    else
    {
        const filePath = Pathfinder.absPathInTestsFolder('logs/') + global.testingRoute + '_' + Date.now() + '.json';

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

exports.registerStartTimeForUnit = function (unitName)
{
    if (isNull(unitName))
    {
        const msg = 'Error at registerStartTimeForUnit: Argument unitName is REQUIRED';
        return msg;
    }
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = 'Error at registerStartTimeForUnit: newTestRouteLog was not properly initialized';
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
        const msg = 'Error at registerStopTimeForUnit: Argument unitName is REQUIRED';
        return msg;
    }
    if (isNull(global.testingRoute) || isNull(global.routesLog) || isNull(global.routesLog[global.testingRoute]))
    {
        const msg = 'Error at registerStopTimeForUnit: newTestRouteLog was not properly initialized';
        return msg;
    }
    if (isNull(global.routesLog[global.testingRoute].unitsData[unitName]) || isNull(global.routesLog[global.testingRoute].unitsData[unitName].startTime))
    {
        const msg = 'Error at registerStopTimeForUnit: unit: ' + unitName + 'was not properly initialized at registerStartTimeForUnit';
        return msg;
    }
    const timeMilliseconds = Date.now();
    global.routesLog[global.testingRoute].unitsData[unitName].stopTime = timeMilliseconds;
    // https://github.com/moment/moment/issues/1048
    let duration = moment.duration(timeMilliseconds - global.routesLog[global.testingRoute].unitsData[unitName].startTime);
    let delta = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(':mm:ss');
    /* let delta = moment.duration(timeMilliseconds - global.routesLog[global.testingRoute].unitsData[unitName].startTime, "milliseconds").humanize(); */
    global.routesLog[global.testingRoute].unitsData[unitName].delta = delta;
    /* printRoutesLog(global.routesLog); */
    return global.routesLog;
};

const printRoutesLog = function (routesLog)
{
    if (isNull(routesLog))
    {
        console.error('ERROR: CANNOT PRINT ROUTES LOG. UNITS LOG IS NULL');
    }
    else
    {
        console.log('-------ROUTES LOG-------');
        console.log(JSON.stringify(routesLog));
    }
};

module.exports = exports;
