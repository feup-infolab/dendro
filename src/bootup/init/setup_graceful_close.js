const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const nodeCleanup = require('node-cleanup');
const npid = require('npid');
const async = require('async');
let pid;

const setupGracefulClose = function(app, server, callback)
{
    //setup graceful server close
    if(process.env.NODE_ENV !== 'test')
    {
        pid = npid.create(Pathfinder.absPathInApp('running.pid'), true); //second arg = overwrite pid if exists
        pid.removeOnExit();
    }

    app.freeResources = function(callback)
    {
        const closeCacheConnections = function(cb)
        {
            const Cache = require(Pathfinder.absPathInSrcFolder("kb/cache/cache.js")).Cache;
            Cache.closeConnections(function(err, result){
                if(!err)
                {
                    Logger.log_boot_message("success", "Closed all cache connections");
                }
                else
                {
                    Logger.log_boot_message("error", "Error closing all cache connections");
                }
                cb(err, result);
            });
        };

        const closeGridFSConnections = function(cb)
        {
            async.map(global.gfs, function(gridFSConnection, cb){
                if(global.gfs.hasOwnProperty(gridFSConnection))
                {
                    global.gfs[gridFSConnection].connection.closeConnection(cb);
                }
            }, function(err, results){
                if(!err)
                {
                    Logger.log_boot_message("success", "Closed all GridFS connections");
                }
                else
                {
                    Logger.log_boot_message("error", "Error closing all GridFS connections");
                }
                cb(err, results);
            });
        };

        const closeMySQLConnectionPool = function(cb)
        {
            Config.getMySQLByID().pool.end(function(err){
                if(err === undefined )
                    err = null;

                if(!err)
                {
                    Logger.log_boot_message("success", "Closed MySQL connection pool");
                }
                else
                {
                    Logger.log_boot_message("error", "Error closing MySQL connection pool");
                }

                cb(err, null);
            });
        };

        const haltHTTPServer = function(cb)
        {
            Logger.log_boot_message("info", "Halting server...");
            server.close(function(err, result){
                if(!(err instanceof Error))
                {
                    Logger.log_boot_message("success", "Server halted successfully.");
                }
                else
                {
                    Logger.log_boot_message("error", "Error halting server: " + err.stack);
                }

                cb(null);
            })
        };

        const removePIDFile = function(cb)
        {
            Logger.log_boot_message("info", "Removing PID file...");
            if(process.env.NODE_ENV !== 'test')
            {
                pid.remove();
                Logger.log_boot_message("success", "Removed PID");
            }
            else
            {
                Logger.log_boot_message("info", "No need to remove PID, because this Dendro is running in TEST Mode");
            }

            cb(null);
        };

        async.series([
            closeCacheConnections,
            closeGridFSConnections,
            closeMySQLConnectionPool,
            haltHTTPServer,
            removePIDFile
        ], function(err, results){
            callback(err, results);
        });
    };

    nodeCleanup(function (exitCode, signal) {
        Logger.log_boot_message("warning", "Signal " + signal + " received!");

        if(signal)
        {
            app.freeResources(function(err){
                if(!err)
                {
                    Logger.log_boot_message("success", "Freed all resources. Halting Dendro Server now.");
                }
                else
                {
                    Logger.log_boot_message("error", "Unable to free all resources, but we are halting Dendro Server anyway.");
                }

                Logger.log_boot_message("success", "No need to remove PID, because this Dendro is running in TEST Mode");
                nodeCleanup.uninstall(); // don't call cleanup handler again
                process.kill(process.pid, signal);
                Logger.log_boot_message("success", "Freed all resources. Halting Dendro Server now.");
            });
        }
        else
        {
            app.freeResources(function(err, results){
                process.kill(process.pid, signal);
            });
        }

        return signal === 0;
    });

    callback(null);
};

module.exports.setupGracefulClose = setupGracefulClose;