const Config = require("../../../src/models/meta/config").Config;

const async = require('async');

const db = require(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const index = require(Pathfinder.absPathInTestsFolder("utils/index/index.Test.js"));

const chai = require('chai');
const should = chai.should();

exports.requireUncached = function(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
};

exports.clearCacheConnections = function(cb)
{

}

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
            exports.quitAllCacheConnections(function (err, results) {
                should.equal(err, null);
                cb(err, results);
            });
        },
        function (cb) {
            exports.quitGridFSConnections(function (err, results) {
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

exports.quitAllCacheConnections = function (cb) {
    const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
    Cache.closeConnections(cb);
};

exports.quitGridFSConnections = function(cb)
{
    for(let gridFSConnection in global.gfs)
    {
        if(global.gfs.hasOwnProperty(gridFSConnection))
        {
            global.gfs[gridFSConnection].connection.closeConnection(function(err, result){});
        }
    }

    cb(null, null);
};

exports.endMysqlConnectionPool = function (cb) {
    //global.mysql
    /*async.mapSeries(global.mysql.connection, function (mysqlConnection, cb) {
        mysqlConnection.connection.end(function(err) {
            cb(err,err);
        });
    }, function (err, results) {
        cb(err, results);
    });*/

    /*global.mysql.connection.release(function (err) {
        cb(err,err);
    });*/
    //global.mysql.connection.destroy();
    /*global.mysql.connection._realEnd(function(err) {
        cb(err,err);
    });*/
    global.mysql.pool.end(function(err){
        if(err === undefined )
            err = null;
        cb(err, null);
    });
};

exports.clearAppState = function (cb) {
    //var db = exports.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

    exports.clearAllData(function(err, results){
        global.tests.server.close();
        exports.endMysqlConnectionPool(function (err, results) {
            should.equal(err, null);
            cb(err, results);
        });
    });
};

exports.resource_id_uuid_regex = function(resource_type)
{
    const regex = "^/r/"+resource_type+"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);
};

module.exports = exports;