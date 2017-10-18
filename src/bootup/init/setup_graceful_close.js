const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DbConnection = require(Pathfinder.absPathInSrcFolder("kb/db.js")).DbConnection;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const nodeCleanup = require("node-cleanup");
const npid = require("npid");
const async = require("async");

const setupGracefulClose = function(app, server, callback)
{
    //setup graceful server close
    if(process.env.NODE_ENV !== 'test')
    {
        app.pid = npid.create(Pathfinder.absPathInApp('running.pid'), true); //second arg = overwrite pid if exists
        app.pid.removeOnExit();
    }

    app.freeResources = function(callback)
    {
        const closeVirtuosoConnections = function(cb)
        {
            const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

            let exited = false;
            //we also register another handler if virtuoso connections take too long to close
            setTimeout(function(){
                if(!exited)
                {
                    console.error("[TIMEOUT] Virtuoso did not close all connections in time!");
                    cb(null);
                }
            }, Config.dbOperationTimeout);

            async.map(Object.keys(Config.db), function(dbConfigKey, cb){
                const dbConfig = Config.db[dbConfigKey];

                if(!isNull(dbConfig.connection) && dbConfig.connection instanceof DbConnection)
                {
                    dbConfig.connection.close(function(err, result){
                        exited = true;
                        console.log("[OK] Virtuoso connections closed gracefully.");
                        if(isNull(err))
                        {
                            cb(null, result);
                        }
                        else
                        {
                            cb(null, result);
                        }
                    });
                }
                else
                {
                    cb(null, null);
                }
            }, function(err, result){
                cb(err, result);
            });
        };

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
                    global.gfs[gridFSConnection].connection.close(cb);
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
                if(isNull(err))
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
            server.close();
            server.destroy();
            cb(null);
        };

        const callGarbageCollector = function(cb)
        {
            if (global.gc) {
                global.gc();
            } 
            cb(null);
        };

        const removePIDFile = function(cb)
        {
            Logger.log_boot_message("info", "Removing PID file...");
            if(process.env.NODE_ENV !== 'test')
            {
                app.pid.remove();
                Logger.log_boot_message("success", "Removed PID");
            }
            else
            {
                Logger.log_boot_message("info", "No need to remove PID, because this Dendro is running in TEST Mode");
            }

            cb(null);
        };

        async.series([
            closeVirtuosoConnections,
            closeCacheConnections,
            closeGridFSConnections,
            closeMySQLConnectionPool,
            haltHTTPServer,
            callGarbageCollector,
            removePIDFile,
        ], function(err, results){
            callback(err, results);
        });
    };

    if(!setupGracefulClose._handlers_are_installed)
    {
        nodeCleanup(function (exitCode, signal) {

            //if this fancy cleanup fails, we drop the hammer in 10 secs
            const setupForceKillTimer = function()
            {
                setTimeout(function(){
                    Logger.log_boot_message("info", "Graceful close timed out. Forcing server closing!");
                    process.kill(process.pid);
                }, Config.dbOperationTimeout);
            };

            setupForceKillTimer();

            if(exitCode || signal)
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
                    Logger.log_boot_message("success", "Freed all resources. Halting Dendro Server with PID "+process.pid+" now. ");
                    process.kill(process.pid, signal);
                });

                return false;
            }
            else if(exitCode === 0)
            {
                process.exit(0);
            }

            return true;

            Logger.log_boot_message("warning", "Signal " + signal + " received, with exit code "+exitCode+"!");
        });
    }

    process.on('unhandledRejection', function(rejection){
        console.error("Unknown error occurred!");
        console.error(rejection.stack);

        //we send SIGINT (like Ctrl+c) so that the graceful
        // cleanup process function can be called (see setup_graceful_close.js)
        process.kill(process.pid, "SIGINT");
    });

    setupGracefulClose._handlers_are_installed = true;

    callback(null);
};

setupGracefulClose._handlers_are_installed = false;

module.exports.setupGracefulClose = setupGracefulClose;