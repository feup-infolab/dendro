const Pathfinder = require("../../../src/models/meta/pathfinder").Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require('async');

const db = require(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const index = require(Pathfinder.absPathInTestsFolder("utils/index/index.Test.js"));

const chai = require('chai');
const should = chai.should();

exports.requireUncached = function(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
};

exports.deleteAllCaches = function (cb) {
    const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
    Cache.deleteAllRecordsOfAllCaches(cb);
};

exports.clearAppState = function (cb) {
    if(!global.tests.server)
    {
        return cb(1, "Server did not start successfully");
    }
    else
    {
        global.tests.app.freeResources(function(err, results){
            // setTimeout(function(){
            //     delete global.tests.app;
            //     delete global.tests.server;
            //     cb(err, results);
            // }, 300);

            delete global.tests.app;
            delete global.tests.server;
            return cb(err, results);
        });
    }
};

exports.resource_id_uuid_regex = function(resource_type)
{
    const regex = "^/r/"+resource_type+"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);
};

module.exports = exports;