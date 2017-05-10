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
        },
        function (cb) {
            exports.quitAllRedisConnections(function (err, results) {
                should.equal(err, null);
                cb(err, results);
            });
        },
        function (cb) {
            exports.endMysqlConnectionPool(function (err, results) {
                should.equal(err, null);
                cb(err, results);
            });
        }
    ], function(err, results){
        cb(err, results);
    });
};

exports.quitAllRedisConnections = function (cb) {
    //GLOBAL.redis[redisConn.id].connection = redisConn;
    async.mapSeries(GLOBAL.redis, function (redisConnection, cb) {
        redisConnection.connection.redis.quit();
        cb(null,null);
    }, function (err, results) {
        cb(err, results);
    });
};

exports.endMysqlConnectionPool = function (cb) {
    //GLOBAL.mysql
    /*async.mapSeries(GLOBAL.mysql.connection, function (mysqlConnection, cb) {
        mysqlConnection.connection.end(function(err) {
            cb(err,err);
        });
    }, function (err, results) {
        cb(err, results);
    });*/

    /*GLOBAL.mysql.connection.release(function (err) {
        cb(err,err);
    });*/
    //GLOBAL.mysql.connection.destroy();
    /*GLOBAL.mysql.connection._realEnd(function(err) {
        cb(err,err);
    });*/
    GLOBAL.mysql.pool.end(function(err){
        if(err === undefined )
            err = null;
        cb(err, null);
    });
};

exports.clearAppState = function (cb) {
    //var db = exports.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

    exports.clearAllData(function(err, results){
        GLOBAL.tests.server.close();
        exports.endMysqlConnectionPool(function (err, results) {
            should.equal(err, null);
            cb(err, results);
        });
    });
};
