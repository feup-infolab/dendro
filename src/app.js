const path = require("path");
const self = this;

let appDir;
if (process.env.NODE_ENV === "test")
{
    appDir = path.resolve(path.dirname(require.main.filename), "../../..");
    console.log("Running in test mode and the app directory is : " + appDir);
}
else
{
    appDir = path.resolve(path.dirname(require.main.filename), "../");
    console.log("Running in production / dev mode and the app directory is : " + appDir);
}

const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

Logger.log_boot_message("info", "Welcome! Booting up a Dendro Node on this machine. Using NodeJS " + process.version);

const validatenv = require("validate-node-version")();

if (!validatenv.satisfies)
{
    throw new Error(validatenv.message);
}
Logger.log_boot_message("info", "Starting Dendro support services...");

/**
 * Module dependencies.
 */

let express = require("express"),
    Q = require("q");

/**
 * Promise for reporting the bootup operation.
 */

let serverListeningPromise = Q.defer();

self.app = express();

let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
let async = require("async");

const runIfMaster = function (initFunction, app, callback)
{
    const cluster = require("cluster");
    if (cluster.isMaster)
    {
        initFunction(app, callback);
    }
    else
    {
        callback(null);
    }
};

/**
 * Environment initialization sequence
 */

const prepareEnvironment = function (callback)
{
    async.waterfall([
        function (callback)
        {
            // we start by initializing the logging
            require(Pathfinder.absPathInSrcFolder("bootup/init/init_logging.js")).initLogging(self.app, callback);
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
            // destroy graphs if needed
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/destroy_all_graphs.js")).destroyAllGraphs, self.app, callback);
        },
        function (callback)
        {
            // setup passport
            require(Pathfinder.absPathInSrcFolder("bootup/init/setup_passport.js")).setupPassport(self.app, callback);
        },
        function (callback)
        {
            // load ontologies from database
            require(Pathfinder.absPathInSrcFolder("bootup/load/load_ontologies.js")).loadOntologies(self.app, callback);
        },
        function (callback)
        {
            // load or save repository platforms on the database
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/load_repository_platforms.js")).loadRepositoryPlatforms, self.app, callback);
        },
        function (callback)
        {
            // load Descriptor Information
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/load_descriptor_information.js")).loadDescriptorInformation, self.app, callback);
        },
        function (callback)
        {
            // init_elasticsearch
            require(Pathfinder.absPathInSrcFolder("bootup/init/init_elasticsearch.js")).initElasticSearch(self.app, callback);
        },
        function (app, index, callback)
        {
            // save index connection
            self.index = index;
            // create search indexes on elasticsearch if needed
            require(Pathfinder.absPathInSrcFolder("bootup/load/create_indexes.js")).createIndexes(app, self.index, callback);
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
        },
        function (callback)
        {
            // init temporary files directory
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/init/init_temp_folder.js")).initTempFilesFolder, self.app, callback);
        },
        function (callback)
        {
            // init folder for temporary files
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/init/init_temp_uploads_folder.js")).initTempUploadsFolder, self.app, callback);
        },
        function (callback)
        {
            // clear files storage
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/clear_files_storage.js")).clearFilesStorage, self.app, callback);
        },
        function (callback)
        {
            // clear datastore
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/load/clear_datastore.js")).clearDataStore, self.app, callback);
        },
        function (callback)
        {
            // add RAM usage monitor if enabled
            runIfMaster(require(Pathfinder.absPathInSrcFolder("bootup/monitoring/monitor_ram_usage.js")).monitorRAMUsage, self.app, callback);
        }
    ], function (err, results)
    {
        if (!isNull(err))
        {
            console.error("There was an error performing preliminary setup operations during Dendro bootup!");
            console.error(JSON.stringify(err));
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

const loadData = function (callback)
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
                Logger.log("info", "Completed initialization. Now running units...");
                return callback(null);
            }
        },
        function (callback)
        {
            // add graceful closing methods to release connections on server shutdown, for example
            require(Pathfinder.absPathInSrcFolder("bootup/init/setup_graceful_close.js")).setupGracefulClose(self.app, self.server, callback);
        }
    ], callback);
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
            loadData(cb);
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
        serverListeningPromise.resolve({server: self.server, app: self.app});
    }
    else
    {
        serverListeningPromise.reject({
            err: err,
            result: result
        });
    }
}
);

exports.serverListening = serverListeningPromise.promise;
