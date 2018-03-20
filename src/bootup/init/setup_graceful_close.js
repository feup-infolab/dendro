const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DbConnection = require(Pathfinder.absPathInSrcFolder("kb/db.js")).DbConnection;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const npid = require("npid");
const async = require("async");
const mkdirp = require("mkdirp");
const path = require("path");
const _ = require("underscore");

const setupGracefulClose = function (app, server, callback)
{
    // setup graceful server close
    if (process.env.NODE_ENV !== "test")
    {
        // second arg = overwrite pid if exists
        app.pid = npid.create(Pathfinder.absPathInApp("running.pid"), true);
        app.pid.removeOnExit();
    }

    app.freeResources = function (callback)
    {
        if (!isNull(Config.debug) && Config.debug.active && !isNull(Config.debug.memory) && Config.debug.memory.dump_snapshots)
        {
            Logger.log("info", "Dumping heap snapshot!");
            const heapdump = require("heapdump");
            const snapshotsFolder = Pathfinder.absPathInApp("profiling/snapshots");
            const snapshotFile = path.join(snapshotsFolder, Date.now() + ".heapsnapshot");

            mkdirp.sync(snapshotsFolder);
            heapdump.writeSnapshot(snapshotFile, function (err, filename)
            {
                if (isNull(err))
                {
                    Logger.log("info", "Dumped snapshot at " + filename + "!");
                }
                else
                {
                    const msg = "Error dumping snapshot at " + filename + "!";
                    Logger.log("error", msg);
                    throw new Error(msg);
                }
            });
        }

        const closeVirtuosoConnections = function (cb)
        {
            const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

            let exited = false;
            // we also register another handler if virtuoso connections take too long to close
            setTimeout(function ()
            {
                if (!exited)
                {
                    Logger.log("error", "[TIMEOUT] Virtuoso did not close all connections in time!");
                    cb(null);
                }
            }, Config.dbOperationTimeout);

            async.mapSeries(Object.keys(Config.db), function (dbConfigKey, cb)
            {
                const dbConfig = Config.db[dbConfigKey];

                if (!isNull(dbConfig.connection) && dbConfig.connection instanceof DbConnection)
                {
                    dbConfig.connection.close(function (err, result)
                    {
                        exited = true;
                        Logger.log("info", "Virtuoso connections closed gracefully.");
                        if (isNull(err))
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
            }, function (err, result)
            {
                cb(err, result);
            });
        };

        const closeCacheConnections = function (cb)
        {
            const Cache = require(Pathfinder.absPathInSrcFolder("kb/cache/cache.js")).Cache;
            Cache.closeConnections(function (err, result)
            {
                if (!err)
                {
                    Logger.log("info", "Closed all cache connections");
                }
                else
                {
                    Logger.log("error", "Error closing all cache connections");
                }
                cb(err, result);
            });
        };

        const closeGridFSConnections = function (cb)
        {
            async.mapSeries(global.gfs, function (gridFSConnection, cb)
            {
                if (global.gfs.hasOwnProperty(gridFSConnection))
                {
                    global.gfs[gridFSConnection].connection.close(cb);
                }
            }, function (err, results)
            {
                if (!err)
                {
                    Logger.log("info", "Closed all GridFS connections");
                }
                else
                {
                    Logger.log("error", "Error closing all GridFS connections");
                }

                cb(err, results);
            });
        };

        const closeMySQLConnectionPool = function (cb)
        {
            /*Config.getMySQLByID().pool.end(function (err)
            {
                if (isNull(err))
                {
                    err = null;
                }

                if (!err)
                {
                    Logger.log("info", "Closed MySQL connection pool");
                }
                else
                {
                    Logger.log("error", "Error closing MySQL connection pool");
                }

                cb(err, null);
            });*/
            Config.getMySQLByID().sequelize.close().then(() => {
                Logger.log("info", "Closed MySQL connection pool");
                cb(null, null);
            }).catch(err => {
                Logger.log("error", "Error closing MySQL connection pool");
                cb(err, null);
            });
        };

        const haltHTTPServer = function (cb)
        {
            Logger.log("info", "Halting server...");
            server.close();
            server.destroy();
            cb(null);
        };

        const callGarbageCollector = function (cb)
        {
            if (global.gc)
            {
                global.gc();
            }
            cb(null);
        };

        const removePIDFile = function (cb)
        {
            Logger.log("info", "Removing PID file...");
            if (process.env.NODE_ENV !== "test")
            {
                app.pid.remove();
                Logger.log("info", "Removed PID");
            }
            else
            {
                Logger.log("info", "No need to remove PID, because this Dendro is running in TEST Mode");
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
            removePIDFile
        ], function (err, results)
        {
            if (!err)
            {
                Logger.log("info", "Freed all resources. Halting Dendro Server now.");
            }
            else
            {
                Logger.log("error", "Unable to free all resources, but we are halting Dendro Server anyway.");
            }

            Logger.log("info", "No need to remove PID, because this Dendro is running in TEST Mode");

            // don't call cleanup handler again
            callback(err, results);
        });
    };

    if (!setupGracefulClose._handlers_are_installed)
    {
        // if this fancy cleanup fails, we drop the hammer in 10 secs
        const setupForceKillTimer = function ()
        {
            setTimeout(function ()
            {
                const msg = "Graceful close timed out. Forcing server closing!";
                Logger.log("warn", msg);
                process.exit(1);
            }, Config.dbOperationTimeout);
        };

        const signals = ["SIGHUP", "SIGINT", "SIGQUIT", "SIGABRT", "SIGTERM"];

        _.map(signals, function (signal)
        {
            process.on(signal, function ()
            {
                setupForceKillTimer();
                Logger.log("warn", "Signal " + signal + " received!");

                app.freeResources(function ()
                {
                    Logger.log("info", "Freed all resources. Halting Dendro Server with PID " + process.pid + " now. ");
                    process.exit(0);
                });
            });
        });

        process.on("uncaughtException", function (exception)
        {
            let msg = "Critical error occurred!";

            msg += "\n" + JSON.stringify(exception);

            if (!isNull(exception.stack))
            {
                msg += "\n" + exception.stack;
            }

            Logger.log("error", msg);

            process.nextTick(function ()
            {
                process.exit(1);
            });
        });

        process.on("exit", function (code)
        {
            Logger.log("info", `Unknown error occurred! About to exit with code ${code}`);

            app.freeResources(function ()
            {
                Logger.log("info", "Freed all resources.");
                Logger.log("error", `Dendro exited because of an error. Check the logs at the ${path.join(__dirname, "logs")} folder`);
                process.exit(code);
            });
        });
    }

    setupGracefulClose._handlers_are_installed = true;

    callback(null);
};

setupGracefulClose._handlers_are_installed = false;

module.exports.setupGracefulClose = setupGracefulClose;
