/**
 * Initialize configuration first before everything else (will init global connections (DB, storage, etc).
 *
 * @type {Function}
 */
var Config = GLOBAL.Config = Object.create(require("./models/meta/config.js").Config);
Config.initGlobals();

/**
 * Module dependencies.
 */

var express = require('express'),
    domain = require('domain'),
    flash = require('connect-flash'),
    http = require('http'),
    path = require('path');
    fs = require('fs');
    morgan = require('morgan');
    favicon = require('serve-favicon');
    bodyParser = require('body-parser');
    methodOverride = require('method-override');
    cookieParser = require('cookie-parser');
    expressSession = require('express-session');
    errorHandler = require('express-session');
    Q = require('q');

var bootupPromise = Q.defer();

var app = express();

var IndexConnection = require(Config.absPathInSrcFolder("/kb/index.js")).IndexConnection;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var GridFSConnection = require(Config.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
var RedisConnection = require(Config.absPathInSrcFolder("/kb/redis.js")).RedisConnection;
var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);
var QueryBasedRouter = Object.create(require(Config.absPathInSrcFolder("/utils/query_based_router.js")).QueryBasedRouter);
var PluginManager = Object.create(require(Config.absPathInSrcFolder("/plugins/plugin_manager.js")).PluginManager);
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var UploadManager = require(Config.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
var RecommendationUtils = require(Config.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;

var async = require('async');
var util = require('util');
var mkdirp = require('mkdirp');

//create temporary uploads folder if not exists
var tempUploadsFolder = Config.tempFilesDir;
var fs = require('fs');

let pid;

try{
    fs.statSync(tempUploadsFolder).isDirectory();
}
catch(e)
{
    console.log("[INFO] Temp uploads folder " + tempUploadsFolder + " does not exist. Creating...")
    try{
        mkdirp.sync(tempUploadsFolder);
        console.log("[SUCCESS] Temp uploads folder " + tempUploadsFolder + " created.")
    }
    catch(e)
    {
        console.error("[FATAL] Unable to create temporary uploads directory at " + tempUploadsFolder + "\n Error : " + JSON.stringify(e));
        process.exit(1);
    }
}

var busboy = require('connect-busboy');
app.use(busboy());

var self = this;

var appSecret = '891237983kjjhagaGSAKPOIOHJFDSJHASDKLASHDK1987123324ADSJHXZ_:;::?=?)=)';

if(Config.logging != null)
{
    async.series([
        function(cb)
        {
            if (Config.logging.app_logs_folder != null && Config.logging.pipe_console_to_logfile)
            {
                var absPath = Config.absPathInApp(Config.logging.app_logs_folder);

                fs.exists(absPath, function (exists)
                {
                    if (!exists)
                    {
                        try
                        {
                            mkdirp.sync(absPath);
                            console.log("[SUCCESS] Temp uploads folder " + absPath + " created.");
                        }
                        catch (e)
                        {
                            console.error("[FATAL] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(e));
                            process.exit(1);
                        }
                    }

                    var util = require('util');
                    var log_file = require('file-stream-rotator').getStream({
                        date_format: 'YYYYMMDD',
                        filename: path.join(absPath, '%DATE%.log'),
                        frequency: 'daily',
                        verbose: false
                    });

                    var log_stdout = process.stdout;

                    console.log = function (d)
                    { //
                        var date = new Date().toISOString();
                        log_file.write("[ " + date + " ] "+ util.format(d) + '\n');
                        log_stdout.write(util.format(d) + '\n');

                        if(d != null && d.stack != null)
                        {
                            log_file.write("[ " + date + " ] "+ util.format(d.stack) + "\n");
                            log_stdout.write(util.format(d.stack) + '\n');
                        }
                    };

                    console.error = function (err)
                    {
                        var date = new Date().toISOString();
                        log_file.write("[ " + new Date().toISOString() + " ] [ERROR] "+ util.format(err) + '\n');
                        log_stdout.write(util.format(err) + '\n');

                        if(err != null && err.stack != null)
                        {
                            log_file.write("[ " + date + " ] "+ util.format(err.stack) + "\n");
                            log_stdout.write(util.format(err.stack) + '\n');
                        }

                        throw err;
                    };

                    process.on('uncaughtException', function (err)
                    {
                        const date = new Date().toISOString();

                        if (err.stack != null)
                        {
                            log_file.write("[ " + date + " ] [ uncaughtException ] " + util.format(err.stack) + "\n");
                        }

                        pid.remove();

                        throw err;
                    });

                    cb(null);
                })
            }
            else
            {
                cb(null);
            }
        },
        function(cb)
        {
            if (Config.logging.log_request_times && Config.logging.request_times_log_folder != null)
            {
                var absPath = Config.absPathInApp(Config.logging.app_logs_folder);

                fs.exists(absPath, function (exists)
                {
                    if (!exists)
                    {
                        try
                        {
                            mkdirp.sync(absPath);
                            var accessLogStream = require('file-stream-rotator').getStream({
                                date_format: 'YYYYMMDD',
                                filename: path.join(absPath, 'times-%DATE%.log'),
                                frequency: 'daily',
                                verbose: false
                            });

                            if (!err)
                            {
                                app.use(morgan(Config.logging.format, {
                                    format: Config.logging.format,
                                    stream: accessLogStream
                                }));

                                cb(err);
                            }
                        }
                        catch (e)
                        {
                            console.error("[ERROR] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(e));
                            process.exit(1);
                        }
                    }
                    else
                    {
                        cb(null);
                    }
                });
            }
            else
            {
                cb(null);
            }
        }
    ], function(err, results){
        if(err)
        {
            console.error("Unable to setup logging!");
            process.exit(1);
        }
    });

}

var appendIndexToRequest = function(req, res, next)
{
    req.index = self.index;
    // for debugging
    req.util = require('util');
    req.async = require('async');

    req.sha1_encode = function(value){
        var crypto = require('crypto');
        return crypto.createHash('sha1').update(value);
    };

    next(null, req, res);
};

var signInDebugUser = function(req, res, next)
{
    //console.log("[INFO] Dendro is in debug mode, user " + Config.debug.session.login_user +" automatically logged in.");
    var User = require('./models/user.js').User;

    if(req.session.user == null)
    {
        User.findByUsername(Config.debug.session.login_user,
            function(err, user) {
                if(!err)
                {
                    if(req.session.user == null)
                    {
                        req.session.user = user;
                        req.session.upload_manager = new UploadManager(user.ddr.username);
                    }

                    // Pass the request to express
                    next(null, req, res);
                }
            });
    }
    else
    {
        next(null, req, res);
    }
};

var appendLocalsToUseInViews = function(req, res, next)
{
    //append request and session to use directly in views and avoid passing around needless stuff
    res.locals.request = req;
    res.locals.baseURI = GLOBAL.db.default.baseURI;

    if(res.locals.Config == null && Config != null)
    {
        res.locals.Config = Config;
    }

    var flashMessagesInfo = req.flash('info');

    if( flashMessagesInfo != null &&
        flashMessagesInfo instanceof Array &&
        flashMessagesInfo.length > 0)
    {
        if(res.locals.info_messages == null)
        {
            res.locals.info_messages = flashMessagesInfo;
        }
        else
        {
            res.locals.info_messages = req.info_messages.concat(flashMessagesInfo);
        }
    }

    var flashMessagesError = req.flash('error');

    if( flashMessagesError != null &&
        flashMessagesError instanceof Array &&
        flashMessagesError.length > 0)
    {
        if(res.locals.error_messages == null)
        {
            res.locals.error_messages = flashMessagesError;
        }
        else
        {
            res.locals.error_messages = res.locals.error_messages.concat(flashMessagesError);
        }
    }

    var flashMessagesSuccess = req.flash('success');

    if( flashMessagesSuccess != null &&
        flashMessagesSuccess instanceof Array &&
        flashMessagesSuccess.length > 0)
    {
        if(res.locals.success_messages == null)
        {
            res.locals.success_messages = flashMessagesSuccess;
        }
        else
        {
            res.locals.success_messages = res.locals.success_messages.concat(flashMessagesSuccess);
        }
    }

    if(Config.debug.session.auto_login)
    {
        if(req.session != null && req.session.user != null)
        {
            //append request and session to use directly in views and avoid passing around needless stuff
            res.locals.session = req.session;

            if(req.session.isAdmin == null)
            {
                req.session.user.isAdmin(function(err, isAdmin){
                    req.session.isAdmin = isAdmin;
                    next(null, req, res);

                    if(err)
                    {
                        console.error("Error checking for admin status of user " + req.session.user.uri + " !!");
                    }
                });
            }
            else
            {
                next(null, req, res);
            }
        }
        else
        {
            next(null, req, res);
        }
    }
    else
    {
        res.locals.session = req.session;

        /*if(req.session != null && req.session.user != null)
        {
            //append request and session to use directly in views and avoid passing around needless stuff
            res.locals.user = req.session.user;
            res.locals.isAdmin = req.session.isAdmin;
        }*/

        next(null, req, res);
    }
};

console.log("[INFO] Welcome! Booting up a Dendro Node on this machine");
console.log("[INFO] Starting Dendro support services...");

async.waterfall([
    function(callback) {
        var db = new DbConnection(
            Config.virtuosoHost,
            Config.virtuosoPort,
            Config.virtuosoAuth.user,
            Config.virtuosoAuth.password,
            Config.maxSimultanousConnectionsToDb);

        db.create(function(db) {
            if(!db)
            {
                console.log("[ERROR] Unable to connect to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);
                process.exit(1);
            }
            else
            {
                console.log("[OK] Connected to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);

                //set default connection. If you want to add other connections, add them in succession.
                GLOBAL.db.default.connection = db;

                callback(null);
            }
        });
    },
    function(callback)
    {
        if(Config.debug.database.destroy_all_graphs_on_startup)
        {
            var graphs = Object.keys(GLOBAL.db);
            var conn = GLOBAL.db.default.connection;

            async.map(graphs, function(graph, cb){

                var graphUri = GLOBAL.db[graph].graphUri;
                conn.deleteGraph(graphUri, function(err){
                    if(err)
                    {
                        callback(err);
                    }
                    else
                    {
                        conn.graphExists(graphUri, function(err, exists){
                            if(exists)
                            {
                                console.error("Tried to delete graph " + graphUri + " but it still exists!");
                                process.exit(1);
                            }
                            else
                            {
                                cb(null, exists);
                            }
                        });
                    }
                });
            }, function(err, res)
            {
                callback(err);
            });
        }
        else
        {
            callback(null);
        }
    },
    function(callback) {

        if(Config.cache.active)
        {
            async.map(Config.cache.redis.instances, function(instance, callback){

                var redisConn = new RedisConnection(
                    instance.options,
                    instance.database_number,
                    instance.id
                );

                GLOBAL.redis[redisConn.id].connection = redisConn;

                redisConn.openConnection(function(err, redisConn) {
                    if(err)
                    {
                        console.log("[ERROR] Unable to connect to Redis instance with ID: " + instance.id + " running on " + instance.options.host + ":" + instance.options.port + " : " + err.message);
                        process.exit(1);
                    }
                    else
                    {
                        console.log("[OK] Connected to Redis cache service with ID : " + redisConn.id + " running on " +  redisConn.host + ":" + redisConn.port);


                        redisConn.deleteAll(function(err, result){
                            if(!err)
                            {
                                console.log("[INFO] Deleted all cache records on Redis instance \""+ redisConn.id +"\" during bootup");
                                callback(null);
                            }
                            else
                            {
                                console.log("[ERROR] Unable to delete all cache records on Redis instance \""+ instance.id +"\" during bootup");
                                process.exit(1);
                            }
                        });
                    }
                });
            }, function(err, results){
                if(!err)
                {
                    console.log("[INFO] All Redis instances are up and running!");
                    callback(null);
                }
                else
                {
                    console.log("[ERROR] Unable to setup Redis instances.");
                    process.exit(1);
                }
            });
        }
        else
        {
            console.log("[INFO] Cache not active in deployment configuration. Continuing Dendro startup without connecting to cache server.");
            callback(null);
        }
    },
    function(callback) {
        console.log("[INFO] Loading ontology parametrization from database... ");

        var Ontology = require(Config.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;

        if(Config.startup.reload_ontologies_on_startup)
        {
            Ontology.initAllFromDatabase(function (err, ontologies)
            {
                if (!err)
                {
                    GLOBAL.allOntologies = ontologies;
                    console.log("[OK] Ontology information successfully loaded from database.");
                    callback(null);
                }
                else
                {
                    console.error("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system.");
                    process.exit(1);
                }
            });
        }
        else
        {
            Ontology.all(function(err, ontologies){
                if(!err)
                {
                    GLOBAL.allOntologies = ontologies;
                    callback(null);
                }
                else
                {
                    console.error("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system from cache.");
                    process.exit(1);
                }

            });
        }
    },
    function(callback) {

        console.log("[INFO] Checking ontology and descriptor parametrizations...");

        Descriptor.validateDescriptorParametrization(function(err, result)
        {
            if(!err)
            {
                console.log("[OK] All ontologies and descriptors seem correctly set up.");
                callback(null);
            }
            else
            {
                console.error("[ERROR] Errors were detected while checking the configuration of descriptors and/or ontologies in the system.");
                process.exit(1);
            }
        });
    },
    function(callback)
    {
        console.log("[INFO] Connecting to ElasticSearch Cluster...");
        self.index = new IndexConnection();

        self.index.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection.indexes.dendro, function(index) {
            if(index.client)
            {
                console.log("[OK] Created connection to ElasticSearch Cluster on "+ Config.elasticSearchHost + ":" + Config.elasticSearchPort +" but did not try to connect yet");
            }
            else
            {
                console.log("[ERROR] Unable to create connection to index " + IndexConnection.indexes.dendro.short_name);
                process.exit(1);
            }
            callback(null);
        });
    },
    function(callback) {
        console.log("[INFO] Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");
        self.index.create_new_index(1, 1, false, function(error,result)
        {
            if(error != null)
            {
                console.log("[ERROR] Unable to create or link to index " + IndexConnection.indexes.dendro.short_name);
                process.exit(1);
            }
            else
            {
                console.log("[OK] Indexes are up and running on "+ Config.elasticSearchHost + ":" + Config.elasticSearchPort);
                callback(null);
            }
        });
    },
    function(callback) {
        var gfs = new GridFSConnection(
            Config.mongoDBHost,
            Config.mongoDbPort,
            Config.mongoDbCollectionName,
            Config.mongoDBAuth.user,
            Config.mongoDBAuth.password
        );

        gfs.openConnection(function(err, gfsConn) {
            if(err)
            {
                console.log("[ERROR] Unable to connect to MongoDB file storage cluster running on " + Config.mongoDBHost + ":" + Config.mongoDbPort + "\n Error description : " + gfsConn);
                process.exit(1);
            }
            else
            {
                console.log("[OK] Connected to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
                GLOBAL.gfs.default.connection = gfs;
                callback(null);
            }
        });
    },
    function(callback)
    {
        var testDRConnection = function (callback)
        {
            console.log("[INFO] Testing connection to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " ...");
            var needle = require("needle");

            var checkUri = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/about";
            // using callback
            needle.get(checkUri, {
                    accept : "application/json"
                },
                function (error, response)
                {
                    if (!error)
                    {
                        console.log("[OK] Successfully connected to Dendro Recommender instance, version " + response.body.version + " at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " :-)");
                        callback(null);
                    }
                    else
                    {
                        console.log("[ERROR] Unable to connect to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "! Aborting startup.");
                        process.exit(1);
                    }
                });
        };

        var setupMySQLConnection = function (callback)
        {
            var mysql = require('mysql');
            var connection = mysql.createConnection({
                host: Config.mySQLHost,
                user: Config.mySQLAuth.user,
                password: Config.mySQLAuth.password,
                database: Config.mySQLDBName,
                multipleStatements: true
            });

            var callbackOK = function (connection)
            {
                console.log("[OK] Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
                GLOBAL.mysql.connection = connection;
                callback(null);
            };

            connection.connect(function (err)
            {
                if (!err)
                {
                    var checkAndCreateTable = function(tablename, cb)
                    {
                        connection.query("SHOW TABLES LIKE '"+tablename+"';", function (err, result, fields)
                        {
                            if (!err)
                            {
                                if (result.length > 0)
                                {
                                    console.log("[INFO] Interactions table "+tablename+" exists in the MySQL database.");
                                    callbackOK(connection);
                                }
                                else
                                {
                                    console.log("[INFO] Interactions table does not exists in the MySQL database. Attempting creation...");

                                    var createTableQuery = "CREATE TABLE `"+tablename+"` (\n" +
                                        "   `id` int(11) NOT NULL AUTO_INCREMENT, \n" +
                                        "   `uri` text, \n" +
                                        "   `created` datetime DEFAULT NULL, \n" +
                                        "   `modified` datetime DEFAULT NULL, \n" +
                                        "   `performedBy` text, \n" +
                                        "   `interactionType` text, \n" +
                                        "   `executedOver` text, \n" +
                                        "   `originallyRecommendedFor` text, \n" +
                                        "   `rankingPosition` int(11) DEFAULT NULL, \n" +
                                        "   `pageNumber` int(11) DEFAULT NULL, \n" +
                                        "   `recommendationCallId` text DEFAULT NULL, \n" +
                                        "   `recommendationCallTimeStamp` datetime DEFAULT NULL, \n" +
                                        "   PRIMARY KEY (`id`) \n" +
                                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8; \n";

                                    console.log("[INFO] Interactions table "+tablename+" does not exist in the MySQL database. Running query for creating interactions table... \n" + createTableQuery);

                                    connection.query(
                                        createTableQuery,
                                        function (err, result, fields)
                                        {
                                            if (!err)
                                            {
                                                console.log("[INFO] Interactions table " + tablename + " succesfully created in the MySQL database.");

                                                var createIndexesQuery =
                                                    "CREATE INDEX " + tablename + "_uri_text ON " + tablename + "(uri(255)); \n" +
                                                    "CREATE INDEX " + tablename + "_performedBy_text ON " + tablename + "(performedBy(255)); \n" +
                                                    "CREATE INDEX " + tablename + "_interaction_type_text ON " + tablename + "(interactionType(255)); \n" +
                                                    "CREATE INDEX " + tablename + "_executedOver_text ON " + tablename + "(executedOver(255)); \n" +
                                                    "CREATE INDEX " + tablename + "_originallyRecommendedFor_text ON " + tablename + "(originallyRecommendedFor(255)); \n";

                                                connection.query(
                                                    createIndexesQuery,
                                                    function (err, result, fields)
                                                    {
                                                        if (!err)
                                                        {
                                                            console.log("[INFO] Indexes on table  " + tablename + " succesfully created in the MySQL database.");
                                                            cb(null, null);
                                                        }
                                                        else
                                                        {
                                                            console.log("[ERROR] Unable to create indexes on table  " + tablename + " in the MySQL database. Query was: \n" + createIndexesQuery + "\n . Result was: \n" + result);
                                                            process.exit(1);
                                                        }
                                                    });
                                            }
                                            else
                                            {
                                                console.log("[ERROR] Unable to create the interactions table "+tablename+" on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                                process.exit(1);
                                            }
                                        });
                                }
                            }
                            else
                            {
                                console.log("[ERROR] Unable to query for the interactions table "+tablename+" on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                process.exit(1);
                            }
                        });
                    }

                    var table_to_write_recommendations = Config.recommendation.getTargetTable();

                    checkAndCreateTable(table_to_write_recommendations, function(err, results)
                    {
                        if(err)
                        {
                            process.exit(1);
                        }
                        else
                        {
                            callbackOK(connection);
                        }
                    });
                }
                else
                {
                    console.log("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                    process.exit(1);
                }
            });
        };

        var recommendation_mode = RecommendationUtils.getActiveRecommender();

        if (recommendation_mode != null)
        {
            async.series([
                    setupMySQLConnection
                ],
                function (err, result)
                {
                    if (!err)
                    {
                        callback(null);
                    }
                });
        }
        else
        {
            console.error("[ERROR] No descriptor recommendation mode set up in deployment config: " + JSON.stringify(Config.recommendation) + ". Set up only one as active. ABORTING Startup.");
            process.exit(1);
        }
    },
    function(callback) {
        console.log("[INFO] Setting up temporary files directory at " + Config.tempFilesDir);

        async.waterfall([
            function(cb)
            {
                if(Config.debug.files.delete_temp_folder_on_startup)
                {
                    console.log("[INFO] Deleting temp files dir at " + Config.tempFilesDir);
                    var fsextra = require('fs-extra');
                    fsextra.remove(Config.tempFilesDir, function (err) {
                        if(!err)
                        {
                            console.log("[OK] Deleted temp files dir at " + Config.tempFilesDir);
                        }
                        else
                        {
                            console.log("[ERROR] Unable to delete temp files dir at " + Config.tempFilesDir);
                        }

                        cb(err);
                    })
                }
                else
                {
                    cb(null);
                }
            },
            function(cb)
            {
                var fsextra = require('fs-extra');
                fsextra.exists(Config.tempFilesDir, function(exists){
                    if(!exists)
                    {
                        try{
                            mkdirp.sync(Config.tempFilesDir);
                            console.log("[OK] Temporary files directory successfully created at " + Config.tempFilesDir);
                            cb();
                        }
                        catch(e)
                        {
                            var msg = "[ERROR] Unable to create temporary files directory at " + Config.tempFilesDir;
                            console.error(msg, e);
                            process.exit(1);
                        }
                    }
                    else
                    {
                        cb(null);
                    }
                });
            }
        ], function(err){
            if(!err)
            {
                console.log("[OK] Temporary files directory successfully set up at " + Config.tempFilesDir);
                callback(null);
            }
            else
            {
                console.error("[ERROR] Unable to set up files directory at " + Config.tempFilesDir);
                process.exit(1);
            }
        });
    },
    function(callback) {

        //try to delete all demo users

        var deleteUser = function(demoUser, callback)
        {
            var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            User.findByUsername(demoUser.username, function(err, user){

                if(!err)
                {
                    if(user == null)
                    {
                        //everything ok, user simply does not exist
                        callback(null, null);
                    }
                    else
                    {
                        console.log("[INFO] Demo user with username " + user.ddr.username + " found. Attempting to delete...");
                        user.deleteAllMyTriples(function(err, result){
                            callback(err, result);
                        });
                    }
                }
                else
                {
                    console.log("[ERROR] Unable to delete user with username " + demoUser.username + ". Error: " + user);
                    callback(err, user);
                }
            });
        };

        async.map(Config.demo_mode.users, deleteUser, function(err, results) {
            if (!err) {
                console.log("[INFO] Existing demo users deleted. ");
                if(Config.demo_mode.active)
                {
                    if(Config.startup.reload_demo_users_on_startup)
                    {
                        var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                        console.log("[INFO] Loading demo users. Demo users (in config.js file) -->" + JSON.stringify(Config.demo_mode.users));

                        var createUser = function(user, callback)
                        {
                            User.createAndInsertFromObject({
                                    foaf: {
                                        mbox: user.mbox,
                                        firstName : user.firstname,
                                        surname : user.surname
                                    },
                                    ddr:
                                    {
                                        username : user.username,
                                        password : user.password
                                    }
                                },
                                function(err, newUser){
                                    if(!err && newUser != null)
                                    {
                                        callback(null,  newUser);
                                    }
                                    else
                                    {
                                        console.log("[ERROR] Error creating new demo User " + JSON.stringify(user));
                                        callback(err, user);
                                    }
                                });
                        };

                        async.map(Config.demo_mode.users, createUser, function(err, results) {
                            if(!err)
                            {
                                console.log("[INFO] Existing demo users recreated. ");
                                callback(err);
                            }
                            else
                            {
                                process.exit(1);
                            }
                        });
                    }
                    else
                    {
                        callback(null);
                    }
                }
                else
                {
                    callback(null);
                }
            }
            else {
                callback(err);
            }
        });
    },
    function(callback) {
        if(Config.startup.reload_administrators_on_startup)
        {
            var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            console.log("[INFO] Loading default administrators. Admins (in config.js file) -->" + JSON.stringify(Config.administrators));

            async.series([
                function(callback)
                {
                    User.removeAllAdmins(callback);
                },
                function(callback)
                {
                    var makeAdmin = function(newAdministrator, callback){

                        var username = newAdministrator.username;
                        var password = newAdministrator.password;
                        var mbox = newAdministrator.mbox;
                        var firstname = newAdministrator.firstname;
                        var surname = newAdministrator.surname;

                        User.findByUsername(username, function(err, user){

                            if(!err && user != null)
                            {
                                user.makeGlobalAdmin(function(err, result){
                                    callback(err, result);
                                });
                            }
                            else
                            {
                                console.log("Non-existent user " + username + ". Creating new for promoting to admin.");

                                User.createAndInsertFromObject({
                                    foaf: {
                                        mbox: mbox,
                                        firstName : firstname,
                                        surname : surname
                                    },
                                    ddr:
                                    {
                                        username : username,
                                        password : password
                                    }
                                },
                                    function(err, newUser){
                                        if(!err && newUser != null && newUser instanceof User)
                                        {
                                            newUser.makeGlobalAdmin(function(err, newUser){
                                                callback(err, newUser);
                                            });
                                        }
                                        else
                                        {
                                            var msg = "Error creating new User" + JSON.stringify(newUser);
                                            console.error(msg);
                                            callback(err, msg);
                                        }
                                });
                            }
                        })
                    };

                    async.map(Config.administrators, makeAdmin, function(err){
                        if(!err)
                        {
                            console.log("[OK] Admins successfully loaded.");
                        }
                        else {
                            console.log("[ERROR] Unable to load admins. Error : " + err);
                        }

                        callback(err);
                    });
                }
            ],
            function(err, results){
                if(!err)
                {
                    callback(null);
                }
                else
                {
                    process.exit(1);
                }
            });
        }
        else
        {
            callback(null);
        }
    },
    function(callback)
    {
        //app's own requires
        var index = require(Config.absPathInSrcFolder("/controllers/index"));
        var users = require(Config.absPathInSrcFolder("/controllers/users"));
        var vertexes = require(Config.absPathInSrcFolder("/controllers/vertexes"));
        var admin = require(Config.absPathInSrcFolder("/controllers/admin"));
        var projects = require(Config.absPathInSrcFolder("/controllers/projects"));
        var files = require(Config.absPathInSrcFolder("/controllers/files"));
        var records = require(Config.absPathInSrcFolder("/controllers/records"));
        var interactions = require(Config.absPathInSrcFolder("/controllers/interactions"));
        var descriptors = require(Config.absPathInSrcFolder("/controllers/descriptors"));
        var evaluation = require(Config.absPathInSrcFolder("/controllers/evaluation"));
        var ontologies = require(Config.absPathInSrcFolder("/controllers/ontologies"));
        var research_domains = require(Config.absPathInSrcFolder("/controllers/research_domains"));
        var repo_bookmarks = require(Config.absPathInSrcFolder("/controllers/repo_bookmarks"));
        var datasets = require(Config.absPathInSrcFolder("/controllers/datasets"));
        var sparql = require(Config.absPathInSrcFolder("/controllers/sparql"));
        var posts = require(Config.absPathInSrcFolder("/controllers/posts"));
        var fileVersions = require(Config.absPathInSrcFolder("/controllers/file_versions"));
        var notifications = require(Config.absPathInSrcFolder("/controllers/notifications"));

        var auth = require(Config.absPathInSrcFolder("/controllers/auth"));

        var recommendation;

        var recommendation_mode = RecommendationUtils.getActiveRecommender();

        if(recommendation_mode == "dendro_recommender")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/dr_recommendation"));
        }
        else if(recommendation_mode == "standalone")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/standalone_recommendation"));
        }
        else if(recommendation_mode == "project_descriptors")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/project_descriptors_recommendation"));
        }
        else if(recommendation_mode == "none")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/no_recommendation"));
        }

        app.use(appendIndexToRequest);

        // all environments
        app.set('port', process.env.PORT || Config.port);
        app.set('views', Config.absPathInSrcFolder('/views'));

        app.set('view engine', 'ejs');
        app.set('etag', 'strong');

        app.use(favicon(Config.absPathInPublicFolder("images/logo_micro.png")));

        //app.use(express.logger('dev'));

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());


        app.use(methodOverride());

        app.use(cookieParser(appSecret));

        const MongoStore = require('connect-mongo')(expressSession);

        var sessionMongoStore = new MongoStore(
        {
            "host": Config.mongoDBHost,
            "port": Config.mongoDbPort,
            "db": Config.mongoDBSessionStoreCollection,
            "url": 'mongodb://'+Config.mongoDBHost+":"+Config.mongoDbPort+"/"+Config.mongoDBSessionStoreCollection
        });

        var slug = require('slug');
        var key = "dendro_" + slug(Config.host)+ "_sessionKey";
        app.use(expressSession(
            {
                secret: appSecret,
                genid: function(){ const uuid = require('uuid'); return uuid.v4() },
                key: key,
                cookie: { maxAge: 1000 * 60 * 60 * 24 * 5 },
                store: sessionMongoStore,
                resave: false,
                saveUninitialized: false
            })
        );

        app.use(flash());

        if(Config.debug.active && Config.debug.session.auto_login)
        {
            app.use(signInDebugUser);
        }

        app.use(appendLocalsToUseInViews);

        app.use(require('stylus').middleware(Config.getPathToPublicFolder()));

        app.use(express.static(Config.getPathToPublicFolder()));

        // all environments

        var env = process.env.NODE_ENV || 'development';
        if ('development' == env)
        {
            app.set('title', 'Dendro');
            app.set('theme', Config.theme);
        }

        //		development only
        if ('development' == app.get('env')) {
            app.use(errorHandler({
                secret: appSecret,
                resave: true,
                saveUninitialized: true
            }));
        }

        app.get('/', index.index);

        app.get('/analytics_tracking_code', index.analytics_tracking_code);

        //nodes
        app.get('/vertexes', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.all);
        app.get('/vertexes/random', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.random);
        app.get('/vertexes/show', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.show);
        app.get('/vertexes/:source/with/:property', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.with_property);

        //search
        app.get('/search', vertexes.search);

        //admin area
        app.get('/admin', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.home);
        app.get('/admin/reindex', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.reindex);
        app.get('/admin/reload', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.reload);

        //low-level sparql endpoint
        app.get('/sparql', async.apply(Permissions.require, [Permissions.role.system.admin]), sparql.show);

        //authentication
        app.get('/login', auth.login);
        app.post('/login', auth.login);

        //ontologies

        app.get('/ontologies/public', ontologies.public);
        //app.get('/ontologies/all', async.apply(Permissions.require, [Permissions.role.system.user]), ontologies.all);
        app.get('/ontologies/all', ontologies.all);
        app.get('/ontologies/autocomplete', async.apply(Permissions.require, [Permissions.role.system.user]), ontologies.ontologies_autocomplete);
        app.get('/ontologies/show/:prefix', async.apply(Permissions.require, [Permissions.role.system.user]), ontologies.show);
        app.post('/ontologies/edit', async.apply(Permissions.require, [Permissions.role.system.admin]), ontologies.edit);

        //descriptors
        app.get('/descriptors/from_ontology/:ontology_prefix', async.apply(Permissions.require, [Permissions.role.system.user]), descriptors.from_ontology);

        //research domains

        app.get('/research_domains/autocomplete', async.apply(Permissions.require, [Permissions.role.system.user]), research_domains.autocomplete);
        app.get('/research_domains', async.apply(Permissions.require, [Permissions.role.system.user]), research_domains.all);
        app.post('/research_domains', async.apply(Permissions.require, [Permissions.role.system.admin]), research_domains.edit);
        app.delete('/research_domains/:uri', async.apply(Permissions.require, [Permissions.role.system.admin]), research_domains.delete);

        //  registration and login
        app.get('/register', auth.register);
        app.post('/register', auth.register);
        app.get('/logout', async.apply(Permissions.require, [Permissions.role.system.user]), auth.logout);

        //people listing
        app.get('/users', users.all);
        app.get('/user/:username', async.apply(Permissions.require, [Permissions.role.system.user]), users.show);
        app.get('/users/loggedUser', users.getLoggedUser);

        app.all('/reset_password', users.reset_password);
        app.all('/set_new_password', users.set_new_password);

        app.get('/me', async.apply(Permissions.require, [Permissions.role.system.user]), users.me);

        //projects
        app.get('/projects', projects.all);
        app.get('/projects/my', async.apply(Permissions.require, [Permissions.role.system.user]), projects.my);
        app.get('/projects/new', async.apply(Permissions.require, [Permissions.role.system.user]), projects.new);
        app.post('/projects/new', async.apply(Permissions.require, [Permissions.role.system.user]), projects.new);

        app.get('/projects/import', async.apply(Permissions.require, [Permissions.role.system.user]), projects.import);
        app.post('/projects/import', async.apply(Permissions.require, [Permissions.role.system.user]), projects.import);

        app.get('/project/:handle/request_access', async.apply(Permissions.require, [Permissions.role.system.user]), projects.requestAccess);
        app.post('/project/:handle/request_access', async.apply(Permissions.require, [Permissions.role.system.user]), projects.requestAccess);
        app.post('/project/:handle/delete', async.apply(Permissions.require, [Permissions.role.system.admin]), projects.delete);
        app.post('/project/:handle/undelete', async.apply(Permissions.require, [Permissions.role.system.admin]), projects.undelete);

        //interactions
        app.post("/interactions/accept_descriptor_from_quick_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_project_favorite);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_favorite);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

        app.post("/interactions/accept_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_project_favorite);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_favorite);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);

        app.post("/interactions/hide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.hide_descriptor_from_quick_list_for_project);
        app.post("/interactions/unhide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unhide_descriptor_from_quick_list_for_project);
        app.post("/interactions/hide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.hide_descriptor_from_quick_list_for_user);
        app.post("/interactions/unhide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unhide_descriptor_from_quick_list_for_user);
        app.post("/interactions/favorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.favorite_descriptor_from_quick_list_for_project);
        app.post("/interactions/favorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.favorite_descriptor_from_quick_list_for_user);

        app.post("/interactions/unfavorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unfavorite_descriptor_from_quick_list_for_user);
        app.post("/interactions/unfavorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unfavorite_descriptor_from_quick_list_for_project);

        app.post("/interactions/accept_descriptor_from_autocomplete", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_autocomplete);
        app.post("/interactions/reject_ontology_from_quick_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.reject_ontology_from_quick_list);
        app.post("/interactions/select_ontology_manually", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.select_ontology_manually);
        app.post("/interactions/select_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.select_descriptor_manually);

        app.post("/interactions/accept_smart_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_smart_descriptor_in_metadata_editor);
        app.post("/interactions/accept_favorite_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_favorite_descriptor_in_metadata_editor);

        app.post("/interactions/delete_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.delete_descriptor_in_metadata_editor);

        app.post("/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_in_metadata_editor);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);


        app.post("/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_in_metadata_editor);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

        app.post("/interactions/fill_in_inherited_descriptor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_inherited_descriptor);


        app.delete("/interactions/delete_all", async.apply(Permissions.require, [Permissions.role.system.admin]), interactions.delete_all_interactions);

        //external repository bookmarks
        app.get('/external_repositories/types', async.apply(Permissions.require, [Permissions.role.system.user]), repo_bookmarks.repository_types);
        app.get('/external_repositories/my', async.apply(Permissions.require, [ Permissions.role.project.contributor, Permissions.role.project.creator]), repo_bookmarks.my);
        app.get('/external_repositories', async.apply(Permissions.require, [Permissions.role.system.admin]), repo_bookmarks.all);
        app.post('/external_repositories/sword_collections', async.apply(Permissions.require, [Permissions.role.system.user]), datasets.sword_collections);
        app.post('/external_repositories/new', async.apply(Permissions.require, [Permissions.role.system.user]), repo_bookmarks.new);
        app.delete('/external_repository/:username/:title', async.apply(Permissions.require, [Permissions.role.project.contributor, Permissions.role.project.creator]), repo_bookmarks.delete);

        //view a project's root
        app.all(/\/project\/([^\/]+)(\/data)?\/?$/, function(req,res, next)
            {
                console.log("Entered Project Root Route. URL : " + req.originalUrl);


                var defaultPermissionsInProjectRoot = [
                    Permissions.project_privacy_status.public,
                    Permissions.project_privacy_status.metadata_only,
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                var modificationPermissions = [
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                var administrationPermissions = [
                    Permissions.role.project.creator
                ];


                req.params.handle = req.params[0];                      //project handle
                req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle;
                req.params.is_project_root = true;

                var queryBasedRoutes = {
                        get: [
                            //downloads
                            {
                                queryKeys : ['download'],
                                handler : files.download,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot download this project."
                            },
                            //backups
                            {
                                queryKeys : ['backup'],
                                handler : files.serve,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot backup this project."
                            },
                            //bagits
                            {
                                queryKeys : ['bagit'],
                                handler : projects.bagit,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot produce a bagit of this project."
                            },
                            //list contents
                            {
                                queryKeys : ['ls'],
                                handler : files.ls,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot list the contents of this project."
                            },
                            //descriptor recommendations
                            {
                                queryKeys : ['metadata_recommendations'],
                                handler : recommendation.recommend_descriptors,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot fetch descriptor recommendations for this project."
                            },
                            //recent changes
                            {
                                queryKeys : ['recent_changes'],
                                handler : projects.recent_changes,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot fetch recent changes for this project."
                            },
                            //project stats
                            {
                                queryKeys : ['stats'],
                                handler : projects.stats,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot fetch recent changes for this project."
                            },
                            //recommendation ontologies
                            {
                                queryKeys : ['recommendation_ontologies'],
                                handler : ontologies.get_recommendation_ontologies,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get recommendation ontologies because you do not have permissions to access this project."
                            },
                            //show versions of resources
                            {
                                queryKeys : ['version'],
                                handler : records.show_version,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get versions of this project because you do not have permissions to access this project."

                            },
                            //auto completing descriptors
                            {
                                queryKeys : ['descriptors_autocomplete'],
                                handler : descriptors.descriptors_autocomplete,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get descriptor autocompletions in this project because you do not have permissions to access this project."

                            },
                            //auto completing ontologies
                            {
                                queryKeys : ['ontology_autocomplete'],
                                handler : ontologies.ontologies_autocomplete,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access this project."
                            },
                            //auto completing users
                            {
                                queryKeys : ['user_autocomplete'],
                                handler : users.users_autocomplete,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get user autocompletions in this resource because you do not have permissions to access this project."
                            },
                            //thumb nails
                            {
                                queryKeys : ['thumbnail'],
                                handler : files.thumbnail,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get thumbnail for this project because you do not have permissions to access this project."
                            },
                            {
                                queryKeys : ['get_contributors'],
                                handler : projects.get_contributors,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get contributors for this project because you do not have permissions to access this project."
                            },
                            //administration page
                            {
                                queryKeys : ['administer'],
                                handler : projects.administer,
                                permissions : administrationPermissions,
                                authentication_error : "Permission denied : cannot access the administration area of the project because you are not its creator."
                            },
                            //metadata
                            {
                                queryKeys: ['metadata'],
                                handler : projects.show,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get metadata for this project because you do not have permissions to access this project."
                            },
                            //metadata deep
                            {
                                queryKeys: ['metadata', 'deep'],
                                handler : records.show_deep,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot get metadata (recursive) for this project because you do not have permissions to access this project."
                            },
                            //default case
                            {
                                queryKeys : [],
                                handler : projects.show,
                                permissions : defaultPermissionsInProjectRoot,
                                authentication_error : "Permission denied : cannot show the project because you do not have permissions to access this project."
                            }
                        ],
                        post: [
                            {
                                queryKeys : ['mkdir'],
                                handler : files.mkdir,
                                permissions : modificationPermissions,
                                authentication_error : "Permission denied : cannot create new folder because you do not have permissions to edit this project."
                            },
                            {
                                queryKeys : ['restore'],
                                handler : files.restore,
                                permissions : modificationPermissions,
                                authentication_error : "Permission denied : cannot restore project from backup because you do not have permissions to edit this project."
                            },
                            {
                                queryKeys : ['administer'],
                                handler : projects.administer,
                                permissions : administrationPermissions,
                                authentication_error : "Permission denied : cannot access the administration area of the project because you are not its creator."
                            },
                            {
                                queryKeys : ['export_to_repository'],
                                handler : datasets.export_to_repository,
                                permissions : modificationPermissions,
                                authentication_error : "Permission denied : cannot export project because you do not have permissions to edit this project."
                            }
                        ]
                        /*all: [
                            //uploads
                            {
                                queryKeys: ['upload'],
                                handler: files.upload,
                                permissions: modificationPermissions
                            }
                        ]*/
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            });

        //      files and folders (data)
        //      downloads
        app.all(/\/project\/([^\/]+)(\/data\/.+\/?)$/,
            function(req,res, next)
            {
                console.log("Entered Project branch Route. URL : " + req.originalUrl);

                var defaultPermissionsInProjectBranch = [
                    Permissions.project_privacy_status.public,
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                var modificationPermissionsBranch = [
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                req.params.handle = req.params[0];                      //project handle
                req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle;

                req.params.filepath = req.params[1];   //relative path encodeuri needed because of spaces in filenames
                req.params.requestedResource = req.params.requestedResource + req.params.filepath;

                req.params.is_project_root = false;

                var queryBasedRoutes = {
                    get: [
                        //downloads
                        {
                            queryKeys : ['download'],
                            handler : files.download,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot download this resource because you do not have permissions to access its project."
                        },
                        //backups
                        {
                            queryKeys : ['backup'],
                            handler : files.serve,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot backup this resource because you do not have permissions to access its project."
                        },
                        //bagits
                        //{
                        //    queryKeys : ['bagit'],
                        //    handler : projects.download,
                        //    permissions : defaultPermissionsInProjectBranch,
                        //    authentication_error : "Permission denied : cannot bagit this resource because you do not have permissions to access its project."
                        //},
                        //list contents
                        {
                            queryKeys : ['ls'],
                            handler :files.ls,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot list the contents of this resource because you do not have permissions to access its project."
                        },
                        //descriptor recommendations
                        {
                            queryKeys : ['metadata_recommendations'],
                            handler : recommendation.recommend_descriptors,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get descriptor recommendations for this resource because you do not have permissions to access its project."
                        },
                        //recent changes
                        {
                            queryKeys : ['recent_changes'],
                            handler : projects.recent_changes,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get recent changes for this resource because you do not have permissions to access its project."
                        },
                        //project stats
                        {
                            queryKeys : ['stats'],
                            handler : projects.stats,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get project stats because you do not have permissions to access this project."
                        },
                        //recommendation ontologies
                        {
                            queryKeys : ['recommendation_ontologies'],
                            handler : ontologies.get_recommendation_ontologies,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get recommendation ontologies because you do not have permissions to access this project."
                        },
                        //show versions of resources
                        {
                            queryKeys : ['version'],
                            handler : records.show_version,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get versions of this resource because you do not have permissions to access this project."
                        },
                        //auto completing descriptors
                        {
                            queryKeys : ['descriptor_autocomplete'],
                            handler : descriptors.descriptors_autocomplete,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get descriptor autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //auto completing ontologies
                        {
                            queryKeys : ['ontology_autocomplete'],
                            handler : ontologies.ontologies_autocomplete,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //thumb nails
                        {
                            queryKeys : ['thumbnail'],
                            handler : files.thumbnail,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get thumbnail for this resource because you do not have permissions to access this project."
                        },
                        //metadata
                        {
                            queryKeys: ['metadata'],
                            handler : records.show,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get metadata for this resource because you do not have permissions to access this project."
                        },
                        //metadata deep
                        {
                            queryKeys: ['metadata', 'deep'],
                            handler : records.show_deep,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get metadata (recursive) for this resource because you do not have permissions to access this project."
                        },
                        //parent metadata
                        {
                            queryKeys: ['parent_metadata'],
                            handler : records.show_parent,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get parent metadata for this resource because you do not have permissions to access this project."
                        },
                        //change_log
                        {
                            queryKeys: ['change_log'],
                            handler : projects.change_log,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get the change log of this resource because you do not have permissions to access this project."
                        },
                        //recommendation_ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler : ontologies.get_recommendation_ontologies,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot get the recommended ontologies for this resource because you do not have permissions to access this project."
                        },
                        //serve files
                        {
                            queryKeys: ['serve'],
                            handler : files.serve,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot serve this file because you do not have permissions to access this project."
                        },
                        //serve files in base64
                        {
                            queryKeys: ['serve_base64'],
                            handler : files.serve_base64,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot serve this file (base64) because you do not have permissions to access this project."
                        },
                        //serve files serialized
                        {
                            queryKeys: ['data'],
                            handler : files.data,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot serve serialized data for this resource because you do not have permissions to access this project."
                        },
                        //metadata_evaluation
                        {
                            queryKeys: ['metadata_evaluation'],
                            handler : evaluation.metadata_evaluation,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot calculate metadata evaluation for this resource because you do not have permissions to access this project."
                        },
                        //default case
                        {
                            queryKeys : [],
                            handler : projects.show,
                            permissions : defaultPermissionsInProjectBranch,
                            authentication_error : "Permission denied : cannot show the resource because you do not have permissions to access this project."
                        }
                    ],
                    post: [
                        {
                            queryKeys : ['update_metadata'],
                            handler : records.update,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot update the resource metadata because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['restore_metadata_version'],
                            handler : records.restore_metadata_version,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot restore the resource metadata because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['register_interaction'],
                            handler : interactions.register,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot register the interaction because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['remove_recommendation_ontology'],
                            handler : interactions.reject_ontology_from_quick_list,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot remove the recommendation ontology interaction because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['mkdir'],
                            handler : files.mkdir,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot create new folder because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['restore'],
                            handler : files.restore,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot restore previous version of resource because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['undelete'],
                            handler : projects.undelete,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot undelete resource because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys : ['export_to_repository'],
                            handler : datasets.export_to_repository,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot export resource because you do not have permissions to edit this project."
                        }
                    ],
                    delete : [
                        {
                            queryKeys : [],
                            handler : files.rm,
                            permissions : modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot delete resource because you do not have permissions to edit this project."
                        }
                    ],
                    all: [
                        //uploads
                        {
                            queryKeys: ['upload'],
                            handler: files.upload,
                            permissions: modificationPermissionsBranch,
                            authentication_error : "Permission denied : cannot upload resource because you do not have permissions to edit this project."
                        }
                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            }
        );

        //      social
        app.get('/posts/all', async.apply(Permissions.require, [Permissions.role.system.user]), posts.all);
        app.post('/posts/post', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPost_controller);
        app.post('/posts/new', async.apply(Permissions.require, [Permissions.role.system.user]), posts.new);
        app.post('/posts/like', async.apply(Permissions.require, [Permissions.role.system.user]), posts.like);
        app.post('/posts/like/liked', async.apply(Permissions.require, [Permissions.role.system.user]), posts.checkIfPostIsLikedByUser);
        app.post('/posts/post/likesInfo', async.apply(Permissions.require, [Permissions.role.system.user]), posts.postLikesInfo);
        app.post('/posts/comment', async.apply(Permissions.require, [Permissions.role.system.user]), posts.comment);
        app.post('/posts/comments', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPostComments);
        app.post('/posts/share', async.apply(Permissions.require, [Permissions.role.system.user]), posts.share);
        app.post('/posts/shares', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPostShares);
        app.get('/posts/countNum', async.apply(Permissions.require, [Permissions.role.system.user]), posts.numPostsDatabase);
        app.get('/posts/:uri', async.apply(Permissions.require, [Permissions.role.system.user]), posts.post);

        //file versions
        app.get('/fileVersions/all', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.all);
        app.get('/fileVersions/countNum', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.numFileVersionsInDatabase);
        app.post('/fileVersions/fileVersion', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.getFileVersion);
        app.get('/fileVersions/:uri', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.fileVersion);
        app.post('/fileVersions/like', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.like);
        app.post('/fileVersions/comment', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.comment);
        app.post('/fileVersions/share', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.share);
        app.post('/fileVersions/fileVersion/likesInfo', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.fileVersionLikesInfo);
        app.post('/fileVersions/shares', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.getFileVersionShares);

        //shares
        app.get('/shares/:uri', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getShare);


        //notifications
        app.get('/notifications/all', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.get_unread_user_notifications);
        app.get('/notifications/notification', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.get_notification_info);
        app.delete('/notifications/notification', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.delete);

        //serve angular JS ejs-generated html partials
        app.get(/(\/app\/views\/.+)\.html$/,
            function(req, res, next){

                var requestedEJSPath = path.join(Config.getPathToPublicFolder(), req.params[0]) + ".ejs";

                fs.exists(requestedEJSPath, function(exists) {
                    if (exists) {
                        fs.readFile(requestedEJSPath, 'utf-8', function(err, data) {
                            if(!err) {
                                var ejs = require('ejs');
                                res.send(ejs.render(data, { locals : res.locals} ));
                            }
                            else
                            {
                                res.status(500).render("/errors/500");
                            }
                        });
                    }
                    else
                    {
                        //fallback to other routes
                        next();
                    }
                });
            });

        /**
         * Register plugins
         */

        PluginManager.registerPlugins(app, function(err, app){
            //The 404 Route (ALWAYS Keep this as the last route)
            // ERRO! Isto entra em conflito com as rotas dos plugins, porque esta é registada antes do registo das rotas dos
            //plugins ter sido concluído

            /*app.get('*', function(req, res){
             res.render('errors/404', 404);
             });*/


            var server = http.createServer(function (req, res) {

                var reqd = domain.create();
                reqd.add(req);
                reqd.add(res);

                // On error dispose of the domain
                reqd.on('error', function (error) {
                    console.error('Error!\n' +  "Code: \n" + error.code + " \nMessage: \n" +error.message + "Request URL: \n" + req.originalRequestUrl);

                    if(error.stack != null)
                    {
                        var util = require('util');
                        console.error('Stack Trace : ' + util.format(error.stack));
                    }

                    reqd.dispose();
                });

                // Pass the request to express
                app(req, res)

            });

            //dont start server twice (for testing)
            //http://www.marcusoft.net/2015/10/eaddrinuse-when-watching-tests-with-mocha-and-supertest.html

            if(process.env.NODE_ENV != 'test')
            {
                server.listen(app.get('port'), function() {
                    const npid = require('npid');
                    const path = require('path');
                    pid = npid.create(Config.absPathInApp('running.pid'), true); //second arg = overwrite pid if exists

                    pid.removeOnExit();

                    process.on('SIGTERM', function (err)
                    {
                        pid.remove();
                        process.exit(err);
                    });

                    process.on('SIGINT', function (err)
                    {
                        pid.remove();
                        process.exit(err);
                    });

                    if (!(Config.logging.app_logs_folder != null && Config.logging.pipe_console_to_logfile))
                    {
                        process.on('uncaughtException', function (err)
                        {
                            pid.remove();
                            throw err;
                        });
                    }

                    console.log('Express server listening on port ' + app.get('port'));
                    bootupPromise.resolve(app);
                });
            }
            else
            {
                console.log('Express server listening on port ' + app.get('port') + " in TEST Mode");
                bootupPromise.resolve(app);
            }

            if(Config.debug.diagnostics.ram_usage_reports)
            {
                setInterval(function ()
                {
                    var pretty = require('prettysize');
                    console.log("[" + Config.version.name + "] RAM Usage : " + pretty(process.memoryUsage().rss));    //log memory usage
                    if (typeof gc === 'function')
                    {
                        gc();
                    }
                }, 2000);
            }

            // Handle 404
            app.use(function(req, res) {
                var acceptsHTML = req.accepts('html');
                var acceptsJSON = req.accepts('json');
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.status(404).json(
                        {
                            result : "error",
                            message : "Page not found"
                        }
                    );
                }
                else
                {
                    res.status(404).render('errors/404',
                        {
                            title : "Page not Found"
                        }
                    )
                }
            });

            // Handle 405
            app.use(function(req, res) {
                var acceptsHTML = req.accepts('html');
                var acceptsJSON = req.accepts('json');
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.status(405).json(
                        {
                            result : "error",
                            message : "Method Not Supported"
                        }
                    );
                }
                else
                {
                    res.status(405).render('errors/404',
                        {
                            title : "Method Not Supported"
                        }
                    )
                }
            });

            // Handle 500
            app.use(function(error, req, res, next) {
                var acceptsHTML = req.accepts('html');
                var acceptsJSON = req.accepts('json');
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.status(500).json(
                        {
                            result : "error",
                            error : error
                        }
                    );
                }
                else
                {
                    res.render('errors/500',
                        {
                            title : "Something went wrong",
                            error : error
                        }
                    )
                }
            });
        });
    }
]);

exports.bootup = bootupPromise.promise;