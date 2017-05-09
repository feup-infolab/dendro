var Config = require("../../../src/models/meta/config").Config;

var async = require('async');

var db = require(Config.absPathInTestsFolder("utils/db/db.Test.js"));
var index = require(Config.absPathInTestsFolder("utils/index/index.Test.js"));

var chai = require('chai');
const should = chai.should();

exports.requireUncached = function(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
};


exports.clearAllData = function (cb) {
    async.series([
        function(cb)
        {
            db.deleteGraphs(function (err, data) {
                should.equal(err, null);
                cb(err, data);
            });
        },
        function(cb)
        {
            index.deleteIndexes(function(err, data){
                should.equal(err, null);
                cb(err, data);
            });
        }
    ], function(err, results){
        cb(err, results);
    });
};

exports.clearAppState = function (cb) {
    //var db = exports.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

    exports.clearAllData(function(err, results){
        GLOBAL.tests.server.close();
        cb(err, results);
    });
};
