const Pathfinder = require("../../../src/models/meta/pathfinder").Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require("async");
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const db = require(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const index = require(Pathfinder.absPathInTestsFolder("utils/index/index.Test.js"));

const chai = require("chai");
const should = chai.should();

exports.requireUncached = function(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
};

exports.clearAppState = function (cb) {
    if(!global.tests.server)
    {
        return cb(1, "Server did not start successfully");
    }
    else
    {
        //TODO HERE CALL showTimeEachUnitTookToComplete
        global.tests.app.freeResources(function(err, results){
            setTimeout(function(){
                delete global.tests.app;
                delete global.tests.server;
                return cb(err, results);
            }, 1000);

            // delete global.tests.app;
            // delete global.tests.server;
            // return cb(err, results);
        });
    }
};

exports.resource_id_uuid_regex = function(resource_type)
{
    const regex = "^/r/"+resource_type+"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);
};

exports.registerStopTimeForUnit = function (unitName) {
    if(isNull(unitName))
    {
        const msg = "Error at registerStopTimeForUnit: Argument unitName is REQUIRED";
        return msg;
    }
    else
    {
        const timeMilliseconds  = Date.now();
        if(isNull(global.unitsLog))
        {
            global.unitsLog = {};
            global.unitsLog[unitName] = timeMilliseconds;
        }
        else
        {
            global.unitsLog[unitName] = timeMilliseconds;
        }
        printUnitsLog(global.unitsLog);
        return global.unitsLog;
    }
};

exports.registerStartTimeForTestRoute = function (testRouteName) {
    if(isNull(testRouteName))
    {
        const msg = "Error at registerStartTimeForTestRoute: Argument testRouteName is REQUIRED";
        return msg;
    }
    else
    {
        const message = "Started " + testRouteName;
        const timeMilliseconds  = Date.now();
        if(isNull(global.unitsLog))
        {
            global.unitsLog = {};
            global.unitsLog[message] = timeMilliseconds;
        }
        else
        {
            global.unitsLog[message] = timeMilliseconds;
        }
        printUnitsLog(global.unitsLog);
        return global.unitsLog;
    }
};

//TODO const showTimeEachUnitTookToComplete = function() -> não recebe nada tem o unitLog global

const printUnitsLog = function (unitsLog) {
    if(isNull(unitsLog))
    {
        console.error("ERROR: CANNOT PRINT UNITS LOG. UNITS LOG IS NULL");
    }
    else
    {
        console.log("-------UNITS LOG-------");
        console.log(JSON.stringify(unitsLog));
    }
};

const showTimeEachUnitTookToComplete = function (callback) {
    let result = {};//TODO JSON WHERE THE RESULTS WILL BE
    if(isNull(global.unitsLog))
    {
        const message = "ERROR: global.unitsLog is null";
        callback(true, message);
    }
    else
    {
        let i = 0;
        for (var key in global.unitsLog) {
            if(i > 0)
            {
                let timeStampOfCurrentUnit = global.unitsLog[key];
                let keyOfPreviousUnit = Object.keys(global.unitsLog)[i-1];
                let timeStampOfPreviousUnit = global.unitsLog[keyOfPreviousUnit];
                result[key] = timeStampOfCurrentUnit - timeStampOfPreviousUnit;
            }
            i++;
        }

        console.log("-------TIME TO COMPLETE EACH UNIT-------");
        callback(null, result);
    }
};

module.exports = exports;