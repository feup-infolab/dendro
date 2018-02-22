const path = require("path");
const async = require("async");
const pm2 = require("pm2");
let Q = require("q");
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

const App = function ()
{
    const self = this;
    self.initLogger();
};

Config.pm2AppName = require(Pathfinder.absPathInApp("package.json")).name + "-" + require(Pathfinder.absPathInApp("package.json")).version;

App.prototype.killPM2InstancesIfRunning = function (cb)
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
};

App.prototype.startPM2Master = function (cb)
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
};

App.prototype.initLogger = function ()
{
    if (global.app_startup_time)
    {
        Logger.init(global.app_startup_time);
    }
    else
    {
        Logger.init(new Date());
    }
};

App.prototype.runIfMaster = function (initFunction, app, callback)
{
    if (!Config.runningAsSlave)
    {
        initFunction(app, callback);
    }
    else
    {
        callback(null);
    }
};

App.prototype.initConnections = function (callback, force)
{
    const self = this;

    if (!self._connectionsUp || force)
    {
        async.waterfall([
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
                // init_elasticsearch
                require(Pathfinder.absPathInSrcFolder("bootup/init/init_elasticsearch.js")).initElasticSearch(self.app, callback);
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
};

App.prototype.startApp = function (callback)
{
    const self = this;
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
         * Module dependencies.
         */

    let express = require("express");

    /**
         * Promise for reporting the bootup operation.
         */

    self.app = express();

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
                    Logger.log("Completed initialization. Now running units...");
                    return callback(null);
                }
            },
            function (callback)
            {
                // add graceful closing methods to release connections on server shutdown, for example
                require(Pathfinder.absPathInSrcFolder("bootup/init/setup_graceful_close.js")).setupGracefulClose(self.app, self.server, callback);
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
            if (Config.startup.load_databases)
            {
                loadInitialUsersData(cb);
            }
            else
            {
                cb(null);
            }
        },
        function (cb)
        {
            startWebServer(cb);
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
};

App.prototype.seedDatabases = function (callback)
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
            // create search indexes on elasticsearch if needed
            require(Pathfinder.absPathInSrcFolder("bootup/load/create_indexes.js")).createIndexes(self.app, callback);
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
};

module.exports.App = App;
