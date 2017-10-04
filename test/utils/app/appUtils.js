const Pathfinder = require("../../../src/models/meta/pathfinder").Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require("async");

const db = require(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const index = require(Pathfinder.absPathInTestsFolder("utils/index/index.Test.js"));

const chai = require("chai");
const should = chai.should();

//to try to cool down tests so that virtuoso does not clog up.
let numberofTestsRun = 0;
//10 sec cooldown every 7 test files
const testsBatchSizeBeforeCooldown = 7;
const testsCooldownTime = 10;

const applyCooldownToTests = function()
{
    numberofTestsRun++;
    if(numberofTestsRun % testsBatchSizeBeforeCooldown === 0)
    {
        console.log("Ran " + numberofTestsRun + " test files. Waiting " + testsCooldownTime + " seconds to allow databases to cooldown.");
        const sleep = require('sleep');
        sleep.sleep(testsCooldownTime);
    }

    console.log("Ran " + numberofTestsRun + " test files. Continuing...");
};


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
        applyCooldownToTests();
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

module.exports = exports;