const path = require("path");
const async = require("async");
const pm2 = require("pm2");
const npid = require("npid");
const mkdirp = require("mkdirp");
const _ = require("underscore");
let appDir;

if (process.env.NODE_ENV === "test")
{
    appDir = path.resolve(path.dirname(require.main.filename), "../../..");
}
else
{
    appDir = path.resolve(path.dirname(require.main.filename), "../");
}

const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DockerManager = require(Pathfinder.absPathInSrcFolder("utils/docker/docker_manager.js")).DockerManager;

Config.pm2AppName = require(Pathfinder.absPathInApp("package.json")).name + "-" + require(Pathfinder.absPathInApp("package.json")).version;

class App
{
    constructor (options)
    {
        const self = this;
        self.initLogger();

        let express = require("express");
        self.app = express();

        self.setupHandlers();

        if (!isNull(options))
        {
            if (options.seed_databases)
            {
                Logger.log("info", "Seeding databases only...");
                self.seedDatabasesAndExit = true;
            }
        }
    }

    setupHandlers ()
    {
        const self = this;
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

                self.freeResources(function ()
                {
                    Logger.log("Freed all resources. Halting Dendro Server with PID " + process.pid + " now. ");
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
            Logger.log(`Unknown error occurred! About to exit with code ${code}`);

            self.freeResources(function ()
            {
                Logger.log("Freed all resources.");
                Logger.log("error", `Dendro exited because of an error. Check the logs at the ${path.join(__dirname, "logs")} folder`);
                process.exit(code);
            });
        });
    }

    initLogger ()
    {
        Logger.init(new Date());
    }

    killPM2InstancesIfRunning (cb)
    {
        pm2.connect(function (err)
        {
            if (err)
            {
                console.error(err);
                throw new Error(err);
            }

            pm2.delete(Config.pm2AppName, function (err)
            {
                cb(err);
            });
        });
    }

    startPM2Master (cb)
    {
        Logger.log_boot_message("PM2 log file path: " + Logger.getLogFilePath());
        pm2.connect(function (err)
        {
            if (err)
            {
                Logger.log("error", err);
                throw new Error(err);
            }

            pm2.delete(Config.pm2AppName, function (err)
            {
                Logger.log_boot_message("PM2 log file path: " + Logger.getLogFilePath());
                Logger.log_boot_message("PM2 error file path: " + Logger.getErrorLogFilePath());

                pm2.start({
                    // Script to be run
                    script: path.join(appDir, "src", "app.js"),
                    // Allows your app to be clustered
                    exec_mode: "cluster",
                    name: Config.pm2AppName,
                    // Optional: Scales your app by X
                    instances: (isNull(Config.numCPUs)) ? "max" : Config.numCPUs,
                    // max_memory_restart : '1024M'   // Optional: Restarts your app if it reaches 100Mo
                    args: ["--pm2_slave=1"],
                    logDateFormat: "YYYY-MM-DD HH:mm Z",
                    // we will handle logs on our own with winston. This is necessary so that there are no conflicts
                    out_file: Logger.getLogFilePath(),
                    error_file: Logger.getErrorLogFilePath(),
                    // merge_logs: true,
                    cwd: appDir,
                    pid: path.join(appDir, "running.pid")
                }, function (err, apps)
                {
                    // Disconnects from PM2
                    pm2.disconnect();
                    if (err)
                    {
                        throw err;
                    }

                    if (typeof cb === "function")
                    {
                        cb();
                    }
                });
            });
        });
    }

    runIfMaster (initFunction, app, callback)
    {
        if (!Config.runningAsSlave)
        {
            initFunction(app, callback);
        }
        else
        {
            callback(null);
        }
    }

    initConnections (callback, force)
    {
        const self = this;

        if (!self._connectionsUp || force)
        {
            async.series([
                function (callback)
                {
                    // start VirtualBox VM
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_virtualbox.js")).initVirtualBoxVM(self.app, callback);
                },
                function (callback)
                {
                    // start docker containers
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_docker.js")).initDockerContainers(self.app, callback);
                },
                function (callback)
                {
                    // setup virtuoso
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_virtuoso.js")).initVirtuoso(self.app, callback);
                },
                function (callback)
                {
                    // setup caches
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_cache.js")).initCache(self.app, callback);
                },
                function (callback)
                {
                    // create search indexes on elasticsearch if needed
                    require(Pathfinder.absPathInSrcFolder("bootup/init/connect_to_indexes.js")).connectToIndexes(self.app, callback);
                },
                function (callback)
                {
                    // init gridfs
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_gridfs.js")).initGridFS(self.app, callback);
                },
                function (callback)
                {
                    // init MySQL Connection pool
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_mysql.js")).initMySQL(self.app, callback);
                },
                function (callback)
                {
                    // connect to descriptor recommender
                    require(Pathfinder.absPathInSrcFolder("bootup/init/connect_to_recommender.js")).connectToRecommender(self.app, callback);
                }
            ], function (err, results)
            {
                if (isNull(err))
                {
                    self._connectionsUp = true;
                    callback(err, {app: self.app});
                }
                else
                {
                    callback(err, {
                        err: err,
                        result: results
                    });
                }
            });
        }
        else
        {
            callback(null, {app: self.app});
        }
    }

    startApp (callback)
    {
        const self = this;

        if (process.env.NODE_ENV !== "test")
        {
            // second arg = overwrite pid if exists
            self.pid = npid.create(Pathfinder.absPathInApp("running.pid"), true);
            self.pid.removeOnExit();
        }

        Logger.log_boot_message("Welcome! Booting up a Dendro Node on this machine. Using NodeJS " + process.version);

        if (process.env.NODE_ENV === "test")
        {
            Logger.log_boot_message("Running in test mode and the app directory is : " + appDir);
        }
        else
        {
            Logger.log_boot_message("Running in NODE ENV \"" + process.env.NODE_ENV + "\" and the app directory is : " + appDir);
        }

        const validatenv = require("validate-node-version")();

        if (!validatenv.satisfies)
        {
            throw new Error(validatenv.message);
        }

        Logger.log_boot_message("Starting Dendro support services...");

        /**
         * Environment initialization sequence
         */

        const prepareEnvironment = function (callback)
        {
            async.waterfall([
                function (callback)
                {
                    // add request logging
                    if (Config.logging.log_all_requests)
                    {
                        Logger.add_middlewares(self.app);
                    }
                    callback(null);
                },
                function (callback)
                {
                    self.initConnections(callback);
                },
                function (appInfo, callback)
                {
                    if (process.env.NODE_ENV !== "test")
                    {
                        self.seedDatabases(function (err, result)
                        {
                            if (!isNull(err))
                            {
                                Logger.log("error", result);
                            }
                            callback(err);
                        });
                    }
                    else
                    {
                        callback(null);
                    }
                },
                function (callback)
                {
                    // setup passport
                    require(Pathfinder.absPathInSrcFolder("bootup/init/setup_passport.js")).setupPassport(self.app, callback);
                },

                function (callback)
                {
                    // init temporary files directory
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_temp_folder.js")).initTempFilesFolder(self.app, callback);
                },
                function (callback)
                {
                    // init folder for temporary files
                    require(Pathfinder.absPathInSrcFolder("bootup/init/init_temp_uploads_folder.js")).initTempUploadsFolder(self.app, callback);
                },
                function (callback)
                {
                    // add RAM usage monitor if enabled
                    self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/monitoring/monitor_ram_usage.js")).monitorRAMUsage, self.app, callback);
                }
            ], function (err, results)
            {
                if (!isNull(err))
                {
                    Logger.log("error", "There was an error performing preliminary setup operations during Dendro bootup!");
                    Logger.log("error", JSON.stringify(err));
                }
                return callback(err, results);
            });
        };

        const setupMiddlewares = function (callback)
        {
            async.waterfall([
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/middleware/load_misc_middlewares.js")).loadMiscMiddlewares(self.app, callback);
                },
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/middleware/append_index_to_requests.js")).appendIndexToRequests(self.app, self.index, callback);
                },
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/middleware/append_locals_to_use_in_views.js")).appendLocalsToUseInViews(self.app, callback);
                }],
            function (err, results)
            {
                return callback(err);
            });
        };

        /**
         * After initialization, load initial data
         */

        const loadInitialUsersData = function (callback)
        {
            async.waterfall([
                function (callback)
                {
                    // load demo users
                    require(Pathfinder.absPathInSrcFolder("bootup/load/users/load_demo_users.js")).loadDemoUsers(self.app, callback);
                },
                function (callback)
                {
                    // load_admins
                    require(Pathfinder.absPathInSrcFolder("bootup/load/users/load_admins.js")).loadAdmins(self.app, callback);
                }],
            function (err, results)
            {
                return callback(err);
            }
            );
        };

        /**
         * Bring up Web Server
         */

        const startWebServer = function (callback)
        {
            async.waterfall([
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/routes/load_logic_routes.js")).loadRoutes(self.app, callback);
                },
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/routes/load_plugins_routes.js")).loadRoutes(self.app, callback);
                },
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/routes/load_error_code_routes.js")).loadRoutes(self.app, callback);
                },
                function (callback)
                {
                    require(Pathfinder.absPathInSrcFolder("bootup/init/setup_server.js")).setupServer(self.app, callback);
                },
                function (app, server, callback)
                {
                    self.server = server;

                    if (process.env.NODE_ENV !== "test")
                    {
                        // dont start server twice (for testing)
                        // http://www.marcusoft.net/2015/10/eaddrinuse-when-watching-tests-with-mocha-and-supertest.html

                        require(Pathfinder.absPathInSrcFolder("bootup/init/start_server.js")).startServer(app, server, function (err, result)
                        {
                            return callback(err);
                        });
                    }
                    else
                    {
                        Logger.log("Completed initialization in test mode... Units should start to load now.");
                        return callback(null);
                    }
                }
            ], function (err, result)
            {
                callback(err, result);
            });
        };

        async.series([
            function (cb)
            {
                prepareEnvironment(cb);
            },
            function (cb)
            {
                setupMiddlewares(cb);
            },
            function (cb)
            {
                if (Config.startup.load_databases || self.seedDatabasesAndExit)
                {
                    loadInitialUsersData(cb);
                }
                else
                {
                    cb(null);
                }
            },
            function (callback)
            {
                require(Pathfinder.absPathInSrcFolder("bootup/cron_jobs/delete_old_temp_folders.js")).deleteOldTempFolders(self.app, callback);
            },
            function (cb)
            {
                if (!self.seedDatabasesAndExit)
                {
                    startWebServer(cb);
                }
                else
                {
                    cb(null);
                }
            }],
        function (err, result)
        {
            if (isNull(err))
            {
                if (typeof callback === "function")
                {
                    callback(err, {server: self.server, app: self.app});
                }
            }
            else
            {
                if (typeof callback === "function")
                {
                    callback(err, {
                        err: err,
                        result: result
                    });
                }
            }
        });
    }

    seedDatabases (callback)
    {
        const self = this;
        async.series([
            function (callback)
            {
                // destroy graphs if needed
                self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/destroy_all_graphs.js")).destroyAllGraphs, self.app, callback);
            },
            function (callback)
            {
                // delete and recreate search indexes on elasticsearch if needed
                require(Pathfinder.absPathInSrcFolder("bootup/load/create_indexes.js")).createIndexes(self.app, callback);
            },
            function (callback)
            {
                // load ontologies from database
                require(Pathfinder.absPathInSrcFolder("bootup/load/load_ontologies.js")).loadOntologies(self.app, callback);
            },
            function (callback)
            {
                // load or save repository platforms on the database
                self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/load_repository_platforms.js")).loadRepositoryPlatforms, self.app, callback);
            },
            function (callback)
            {
                // load Descriptor Information
                self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/load_descriptor_information.js")).loadDescriptorInformation, self.app, callback);
            },
            function (callback)
            {
                // clear files storage
                self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/clear_files_storage.js")).clearFilesStorage, self.app, callback);
            },
            function (callback)
            {
                // clear datastore
                self.runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/clear_datastore.js")).clearDataStore, self.app, callback);
            }
        ], callback);
    }

    freeResources (callback)
    {
        const self = this;
        if (!isNull(Config.debug) && Config.debug.active && !isNull(Config.debug.memory) && Config.debug.memory.dump_snapshots)
        {
            Logger.log("Dumping heap snapshot!");
            const heapdump = require("heapdump");
            const snapshotsFolder = Pathfinder.absPathInApp("profiling/snapshots");
            const snapshotFile = path.join(snapshotsFolder, Date.now() + ".heapsnapshot");

            mkdirp.sync(snapshotsFolder);
            heapdump.writeSnapshot(snapshotFile, function (err, filename)
            {
                if (isNull(err))
                {
                    Logger.log("Dumped snapshot at " + filename + "!");
                }
                else
                {
                    const msg = "Error dumping snapshot at " + filename + "!";
                    Logger.log("error", msg);
                    throw new Error(msg);
                }
            });
        }

        const waitForPendingConnectionsToFinishup = function (cb)
        {
            let count = 0;
            if (!isNull(self.server))
            {
                Logger.log("Waiting for pending connections to finish up...");
                async.during(function (callback)
                {
                    if (count > 20)
                    {
                        Logger.log("warn", "Still pending connections even after " + count + " attempts!");
                        callback(null);
                    }
                    else
                    {
                        self.server.getConnections(function (err, connections)
                        {
                            callback(err, (connections > 0));
                        });
                    }
                },
                function (callback)
                {
                    count++;
                    setTimeout(callback, 1000);
                },
                function (err, result)
                {
                    cb(err, result);
                });
            }
            else
            {
                cb(null);
            }
        };

        const closeVirtuosoConnections = function (cb)
        {
            const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
            DbConnection.finishUpAllConnectionsAndClose(function ()
            {
                const timeout = 2000;
                Logger.log("Waiting " + timeout + "ms for virtuoso to flush the buffers...");
                setTimeout(cb, timeout);
            });
        };

        const closeCacheConnections = function (cb)
        {
            const Cache = require(Pathfinder.absPathInSrcFolder("kb/cache/cache.js")).Cache;
            Cache.closeConnections(function (err, result)
            {
                if (!err)
                {
                    Logger.log("Closed all cache connections");
                }
                else
                {
                    Logger.log("error", "Error closing all cache connections");
                }
                cb(err, result);
            });
        };

        const closeIndexConnections = function (cb)
        {
            const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
            IndexConnection.closeConnections(function (err, result)
            {
                if (!err)
                {
                    Logger.log("Closed all ElasticSearch connections");
                }
                else
                {
                    Logger.log("error", "Error closing all ElasticSearch connections");
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
                    Logger.log("Closed all GridFS connections");
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
            if (!isNull(Config.getMySQLByID().connection))
            {
                Config.getMySQLByID().connection.releaseAllConnections(function (err)
                {
                    if (isNull(err))
                    {
                        err = null;
                    }

                    if (!err)
                    {
                        Logger.log("Closed MySQL connection pool");
                    }
                    else
                    {
                        Logger.log("error", "Error closing MySQL connection pool");
                    }

                    cb(err, null);
                });
            }
            else
            {
                cb(null, null);
            }
        };

        const haltHTTPServer = function (cb)
        {
            Logger.log("Halting server...");

            if (self.server)
            {
                self.server.close();
                self.server.destroy();
            }

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
            Logger.log("Removing PID file...");
            if (process.env.NODE_ENV !== "test")
            {
                self.pid.remove();
                Logger.log("Removed PID");
            }
            else
            {
                Logger.log("No need to remove PID, because this Dendro is running in TEST Mode");
            }

            cb(null);
        };

        const haltDockerContainers = function (cb)
        {
            if (Config.docker && Config.docker.active && process.env.NODE_ENV !== "test")
            {
                Logger.log("Halting docker containers...");

                DockerManager.stopAllContainers();
                cb(null);
            }
            else
            {
                cb(null);
            }
        };

        const destroyLogger = function (cb)
        {
            Logger.log("Destroying logger...");
            Logger.destroy();
            cb(null);
        };

        async.series([
            waitForPendingConnectionsToFinishup,
            closeVirtuosoConnections,
            closeCacheConnections,
            closeIndexConnections,
            closeGridFSConnections,
            closeMySQLConnectionPool,
            haltHTTPServer,
            callGarbageCollector,
            removePIDFile,
            haltDockerContainers,
            destroyLogger
        ], function (err, results)
        {
            if (!err)
            {
                Logger.log("Freed all resources. Halting Dendro Server now.");
            }
            else
            {
                Logger.log("error", "Unable to free all resources, but we are halting Dendro Server anyway.");
            }
            // don't call cleanup handler again
            if (!isNull(callback) && typeof callback === "function")
            {
                callback(err, results);
            }
        });
    }
}

App._handlers_are_installed = false;

module.exports.App = App;
