/**
 * Initialize configuration first before everything else (will init global connections (DB, storage, etc).
 *
 * @type {Function}
 */
const Config = GLOBAL.Config = Object.create(require("./models/meta/config.js").Config);
Config.initGlobals();

/**
 * Module dependencies.
 */

let express = require('express'),
    domain = require('domain'),
    passport = require('passport'),
    flash = require('connect-flash'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    morgan = require('morgan'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    errorHandler = require('express-session'),
    Q = require('q'),
    swaggerUi = require('swagger-ui-express'),
    YAML = require('yamljs'),
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: true }),

    swaggerDocument = YAML.load(Config.absPathInApp("swagger.yaml"));

let bootupPromise = Q.defer();
let connectionsInitializedPromise = Q.defer();

let app = express();

let isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
let IndexConnection = require(Config.absPathInSrcFolder("/kb/index.js")).IndexConnection;
let DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
let GridFSConnection = require(Config.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
let RedisConnection = require(Config.absPathInSrcFolder("/kb/redis.js")).RedisConnection;
let Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);
let QueryBasedRouter = Object.create(require(Config.absPathInSrcFolder("/utils/query_based_router.js")).QueryBasedRouter);
let PluginManager = Object.create(require(Config.absPathInSrcFolder("/plugins/plugin_manager.js")).PluginManager);
let Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
let Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
let UploadManager = require(Config.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
let RecommendationUtils = require(Config.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;
let User = require('./models/user.js').User;

let async = require('async');
let util = require('util');
let mkdirp = require('mkdirp');
let pid;
let registeredUncaughtExceptionHandler;

//Setup logging
if(!isNull(Config.logging))
{
    async.series([
        function(cb)
        {
            if (!isNull(Config.logging.app_logs_folder) && (Config.logging.pipe_console_to_logfile || Config.logging.suppress_all_logs || Config.logging.suppress_all_logs))
            {
                const absPath = Config.absPathInApp(Config.logging.app_logs_folder);

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

                    const util = require('util');
                    const log_file = require('file-stream-rotator').getStream({
                        date_format: 'YYYYMMDD',
                        filename: path.join(absPath, '%DATE%.log'),
                        frequency: 'daily',
                        verbose: false
                    });

                    const log_stdout = process.stdout;

                    if(Config.logging.suppress_all_logs)
                    {
                        console.log = function (d)
                        {
                            let a = 1;
                        };
                    }
                    else {
                        console.log = function (d) { //
                            const date = new Date().toISOString();
                            log_file.write("[ " + date + " ] " + util.format(d) + '\n');
                            log_stdout.write(util.format(d) + '\n');

                            if (!isNull(d) && !isNull(d.stack)) {
                                log_file.write("[ " + date + " ] " + util.format(d.stack) + "\n");
                                log_stdout.write(util.format(d.stack) + '\n');
                            }
                        };
                    }
                    if(Config.logging.suppress_all_errors)
                    {
                        console.error = function (d)
                        {};
                    }
                    else
                    {
                        console.error = function (err)
                        {
                            const date = new Date().toISOString();
                            log_file.write("[ " + new Date().toISOString() + " ] [ERROR] "+ util.format(err) + '\n');
                            log_stdout.write(util.format(err) + '\n');

                            if(!isNull(err) && !isNull(err.stack))
                            {
                                log_file.write("[ " + date + " ] "+ util.format(err.stack) + "\n");
                                log_stdout.write(util.format(err.stack) + '\n');
                            }
                        };
                    }

                    if (!registeredUncaughtExceptionHandler && !(typeof Config.logging.app_logs_folder !== "undefined" && Config.logging.pipe_console_to_logfile))
                    {
                        process.on('uncaughtException', function (err)
                        {
                            const date = new Date().toISOString();

                            if (!isNull(err.stack))
                            {
                                log_file.write("[ " + date + " ] [ uncaughtException ] " + util.format(err.stack) + "\n");
                            }

                            if(!isNull(pid))
                            {
                                pid.remove();
                            }

                            throw err;
                        });

                        registeredUncaughtExceptionHandler = true;
                    }

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
            if(Config.logging.log_all_requests)
            {
                app.use(morgan('combined'));
            }

            if (Config.logging.log_request_times && typeof Config.logging.request_times_log_folder !== "undefined")
            {
                const absPath = Config.absPathInApp(Config.logging.app_logs_folder);

                fs.exists(absPath, function (exists)
                {
                    if (!exists)
                    {
                        try
                        {
                            mkdirp.sync(absPath);
                            const accessLogStream = require('file-stream-rotator').getStream({
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
                            console.error("[ERROR] Error creating folder for logs at " + absPath + "\n" + JSON.stringify(e));
                            //process.exit(1);
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

//set serialization and deserialization methods

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, new User(user));
});

//create temporary uploads folder if not exists
let tempUploadsFolder = Config.tempFilesDir;

try{
    fs.statSync(tempUploadsFolder).isDirectory();
}
catch(e)
{
    console.log("[INFO] Temp uploads folder " + tempUploadsFolder + " does not exist. Creating...");
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

const busboy = require('connect-busboy');
app.use(busboy());

const self = this;

const appSecret = '891237983kjjhagaGSAKPOIOHJFDSJHASDKLASHDK1987123324ADSJHXZ_:;::?=?)=)';

const appendIndexToRequest = function (req, res, next) {
    req.index = self.index;
    // for debugging
    req.util = require('util');
    req.async = require('async');

    req.sha1_encode = function (value) {
        const crypto = require('crypto');
        return crypto.createHash('sha1').update(value);
    };

    next(null, req, res);
};

const signInDebugUser = function (req, res, next) {
    //console.log("[INFO] Dendro is in debug mode, user " + Config.debug.session.login_user +" automatically logged in.");

    if (isNull(req.user)) {
        User.findByUsername(Config.debug.session.login_user,
            function (err, user) {
                if (!err) {
                    if (isNull(req.user)) {
                        req.user = user;
                        req.session.upload_manager = new UploadManager(user.ddr.username);
                    }

                    // Pass the request to express
                    next(null, req, res);
                }
            });
    }
    else {
        next(null, req, res);
    }
};

const appendLocalsToUseInViews = function (req, res, next) {
    //append request and session to use directly in views and avoid passing around needless stuff
    res.locals.request = req;
    res.locals.baseURI = GLOBAL.db.default.baseURI;

    if (isNull(res.locals.Config) && !isNull(Config)) {
        res.locals.Config = Config;
    }

    const flashMessagesInfo = req.flash('info');

    if (!isNull(flashMessagesInfo) &&
        flashMessagesInfo instanceof Array &&
        flashMessagesInfo.length > 0) {
        if (typeof res.locals.info_messages === "undefined") {
            res.locals.info_messages = flashMessagesInfo;
        }
        else {
            res.locals.info_messages = req.info_messages.concat(flashMessagesInfo);
        }
    }

    const flashMessagesError = req.flash('error');

    if (!isNull(flashMessagesError) &&
        flashMessagesError instanceof Array &&
        flashMessagesError.length > 0) {
        if (isNull(res.locals.error_messages)) {
            res.locals.error_messages = flashMessagesError;
        }
        else {
            res.locals.error_messages = res.locals.error_messages.concat(flashMessagesError);
        }
    }

    const flashMessagesSuccess = req.flash('success');

    if (!isNull(flashMessagesSuccess) &&
        flashMessagesSuccess instanceof Array &&
        flashMessagesSuccess.length > 0) {
        if (typeof res.locals.success_messages === "undefined") {
            res.locals.success_messages = flashMessagesSuccess;
        }
        else {
            res.locals.success_messages = res.locals.success_messages.concat(flashMessagesSuccess);
        }
    }

    if (Config.debug.session.auto_login) {
        if (!isNull(req.session) && !isNull(req.user) && req.user instanceof Object) {
            //append request and session to use directly in views and avoid passing around needless stuff
            res.locals.session = req.session;

            if (isNull(req.session.isAdmin)) {
                req.user.isAdmin(function (err, isAdmin) {
                    req.session.isAdmin = isAdmin;
                    next(null, req, res);

                    if (err) {
                        console.error("Error checking for admin status of user " + req.user.uri + " !!");
                    }
                });
            }
            else {
                next(null, req, res);
            }
        }
        else {
            next(null, req, res);
        }
    }
    else {
        res.locals.session = req.session;
        res.locals.user = req.user;

        req.passport = passport;

        /*if(req.session != null && req.user != null)
         {
         //append request and session to use directly in views and avoid passing around needless stuff
         res.locals.user = req.user;
         res.locals.isAdmin = req.session.isAdmin;
         }*/

        next(null, req, res);
    }
};

console.log("[INFO] Welcome! Booting up a Dendro Node on this machine");
console.log("[INFO] Starting Dendro support services...");

const init = function(callback)
{
    async.waterfall([
        function(callback) {
            let db = new DbConnection(
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

                    return callback(null);
                }
            });
        },
        function(callback) {
            if(Config.debug.database.destroy_all_graphs_on_startup)
            {
                const graphs = Object.keys(GLOBAL.db);
                const conn = GLOBAL.db.default.connection;

                async.map(graphs, function(graph, cb){

                    const graphUri = GLOBAL.db[graph].graphUri;
                    conn.deleteGraph(graphUri, function(err){
                        if(err)
                        {
                            return callback(err);
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
                    return callback(err);
                });
            }
            else
            {
                return callback(null);
            }
        },
        function(callback) {

            if(Config.cache.active)
            {
                async.map(Config.cache.redis.instances, function(instance, callback){

                    const redisConn = new RedisConnection(
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
                                    return callback(null);
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
                        return callback(null);
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
                return callback(null);
            }
        },
        function(callback) {
            console.log("[INFO] Loading ontology parametrization from database... ");

            const Ontology = require(Config.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;

            if(Config.startup.reload_ontologies_on_startup)
            {
                Ontology.initAllFromDatabase(function (err, ontologies)
                {
                    if (!err)
                    {
                        GLOBAL.allOntologies = ontologies;
                        console.log("[OK] Ontology information successfully loaded from database.");
                        return callback(null);
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
                        return callback(null);
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
                    return callback(null);
                }
                else
                {
                    console.error("[ERROR] Errors were detected while checking the configuration of descriptors and/or ontologies in the system.");
                    process.exit(1);
                }
            });
        },
        function(callback) {
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
                return callback(null);
            });
        },
        function(callback) {
            console.log("[INFO] Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");
            self.index.create_new_index(1, 1, false, function(error,result)
            {
                if(!isNull(error))
                {
                    console.log("[ERROR] Unable to create or link to index " + IndexConnection.indexes.dendro.short_name);
                    process.exit(1);
                }
                else
                {
                    console.log("[OK] Indexes are up and running on "+ Config.elasticSearchHost + ":" + Config.elasticSearchPort);
                    return callback(null);
                }
            });
        },
        function(callback) {
            const gfs = new GridFSConnection(
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
                    return callback(null);
                }
            });
        },
        function(callback) {
            const testDRConnection = function (callback) {
                console.log("[INFO] Testing connection to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " ...");
                const needle = require("needle");

                const checkUri = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/about";
                // using callback
                needle.get(checkUri, {
                        accept: "application/json"
                    },
                    function (error, response) {
                        if (!error) {
                            console.log("[OK] Successfully connected to Dendro Recommender instance, version " + response.body.version + " at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " :-)");
                            return callback(null);
                        }
                        else {
                            console.log("[ERROR] Unable to connect to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "! Aborting startup.");
                            process.exit(1);
                        }
                    });
            };

            const setupMySQLConnection = function (callback) {
                const mysql = require('mysql');
                //var connection = mysql.createConnection({
                const pool = mysql.createPool({
                    host: Config.mySQLHost,
                    user: Config.mySQLAuth.user,
                    password: Config.mySQLAuth.password,
                    database: Config.mySQLDBName,
                    multipleStatements: true
                });

                const poolOK = function (pool) {
                    console.log("[OK] Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
                    GLOBAL.mysql.pool = pool;
                    return callback(null);
                };

                //connection.connect(function (err)
                pool.getConnection(function (err, connection) {
                    const freeConnectionsIndex = pool._freeConnections.indexOf(connection);
                    //console.log("FREE CONNECTIONS: ", freeConnectionsIndex);
                    if (!err) {
                        const checkAndCreateTable = function (tablename, cb) {
                            connection.query("SHOW TABLES LIKE '" + tablename + "';", function (err, result, fields) {
                                connection.release();
                                if (!err) {
                                    if (result.length > 0) {
                                        console.log("[INFO] Interactions table " + tablename + " exists in the MySQL database.");
                                        poolOK(pool);
                                    }
                                    else {
                                        console.log("[INFO] Interactions table does not exists in the MySQL database. Attempting creation...");

                                        const createTableQuery = "CREATE TABLE `" + tablename + "` (\n" +
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

                                        console.log("[INFO] Interactions table " + tablename + " does not exist in the MySQL database. Running query for creating interactions table... \n" + createTableQuery);

                                        connection.query(
                                            createTableQuery,
                                            function (err, result, fields) {
                                                connection.release();
                                                if (!err) {
                                                    console.log("[INFO] Interactions table " + tablename + " succesfully created in the MySQL database.");

                                                    const createIndexesQuery =
                                                        "CREATE INDEX " + tablename + "_uri_text ON " + tablename + "(uri(255)); \n" +
                                                        "CREATE INDEX " + tablename + "_performedBy_text ON " + tablename + "(performedBy(255)); \n" +
                                                        "CREATE INDEX " + tablename + "_interaction_type_text ON " + tablename + "(interactionType(255)); \n" +
                                                        "CREATE INDEX " + tablename + "_executedOver_text ON " + tablename + "(executedOver(255)); \n" +
                                                        "CREATE INDEX " + tablename + "_originallyRecommendedFor_text ON " + tablename + "(originallyRecommendedFor(255)); \n";

                                                    connection.query(
                                                        createIndexesQuery,
                                                        function (err, result, fields) {
                                                            connection.release();
                                                            if (!err) {
                                                                console.log("[INFO] Indexes on table  " + tablename + " succesfully created in the MySQL database.");
                                                                cb(null, null);
                                                            }
                                                            else {
                                                                console.log("[ERROR] Unable to create indexes on table  " + tablename + " in the MySQL database. Query was: \n" + createIndexesQuery + "\n . Result was: \n" + result);
                                                                process.exit(1);
                                                            }
                                                        });
                                                }
                                                else {
                                                    console.log("[ERROR] Unable to create the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                                    process.exit(1);
                                                }
                                            });
                                    }
                                }
                                else {
                                    console.log("[ERROR] Unable to query for the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                    process.exit(1);
                                }
                            });
                        };

                        const table_to_write_recommendations = Config.recommendation.getTargetTable();

                        checkAndCreateTable(table_to_write_recommendations, function (err, results) {
                            if (err) {
                                process.exit(1);
                            }
                            else {
                                poolOK(connection);
                            }
                        });
                    }
                    else {
                        console.log("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                        process.exit(1);
                    }
                });
            };

            const recommendation_mode = RecommendationUtils.getActiveRecommender();

            if (typeof recommendation_mode !== "undefined")
            {
                async.series([
                        setupMySQLConnection
                    ],
                    function (err, result)
                    {
                        if (!err)
                        {
                            return callback(null);
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
                        const fsextra = require('fs-extra');
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
                    const fsextra = require('fs-extra');
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
                                const msg = "[ERROR] Unable to create temporary files directory at " + Config.tempFilesDir;
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
                    return callback(null);
                }
                else
                {
                    console.error("[ERROR] Unable to set up files directory at " + Config.tempFilesDir);
                    process.exit(1);
                }
            });
        }
    ],function(err, results)
    {
        if(!err)
        {
            connectionsInitializedPromise.resolve();
        }
        else
        {
            connectionsInitializedPromise.reject(results);
        }

        return callback(err, results);
    });
};

const loadData = function(callback)
{
    async.waterfall([
        function(callback) {

            //try to delete all demo users

            const deleteUser = function (demoUser, callback) {
                const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                User.findByUsername(demoUser.username, function (err, user) {

                    if (!err) {
                        if (isNull(user)) {
                            //everything ok, user simply does not exist
                            return callback(null, null);
                        }
                        else {
                            console.log("[INFO] Demo user with username " + user.ddr.username + " found. Attempting to delete...");
                            user.deleteAllMyTriples(function (err, result) {
                                return callback(err, result);
                            });
                        }
                    }
                    else {
                        console.log("[ERROR] Unable to delete user with username " + demoUser.username + ". Error: " + user);
                        return callback(err, user);
                    }
                });
            };

            async.map(Config.demo_mode.users, deleteUser, function(err, results) {
                if (!err) {
                    console.log("[INFO] Existing demo users deleted. ");
                    if(Config.demo_mode.active)
                    {
                        if(Config.startup.load_databases && Config.startup.reload_demo_users_on_startup)
                        {
                            const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                            console.log("[INFO] Loading demo users. Demo users (in config.js file) -->" + JSON.stringify(Config.demo_mode.users));

                            const createUser = function (user, callback) {
                                User.createAndInsertFromObject({
                                        foaf: {
                                            mbox: user.mbox,
                                            firstName: user.firstname,
                                            surname: user.surname
                                        },
                                        ddr: {
                                            username: user.username,
                                            password: user.password
                                        }
                                    },
                                    function (err, newUser) {
                                        if (!err && !isNull(newUser)) {
                                            return callback(null, newUser);
                                        }
                                        else {
                                            console.log("[ERROR] Error creating new demo User " + JSON.stringify(user));
                                            return callback(err, user);
                                        }
                                    });
                            };

                            async.map(Config.demo_mode.users, createUser, function(err, results) {
                                if(!err)
                                {
                                    console.log("[INFO] Existing demo users recreated. ");
                                    return callback(err);
                                }
                                else
                                {
                                    process.exit(1);
                                }
                            });
                        }
                        else
                        {
                            return callback(null);
                        }
                    }
                    else
                    {
                        return callback(null);
                    }
                }
                else {
                    return callback(err);
                }
            });
        },
        function(callback) {
            if(Config.startup.load_databases && Config.startup.reload_administrators_on_startup)
            {
                const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                console.log("[INFO] Loading default administrators. Admins (in config.js file) -->" + JSON.stringify(Config.administrators));

                async.series([
                        function(callback)
                        {
                            User.removeAllAdmins(callback);
                        },
                        function(callback)
                        {
                            const makeAdmin = function (newAdministrator, callback) {

                                const username = newAdministrator.username;
                                const password = newAdministrator.password;
                                const mbox = newAdministrator.mbox;
                                const firstname = newAdministrator.firstname;
                                const surname = newAdministrator.surname;

                                User.findByUsername(username, function (err, user) {

                                    if (!err && !isNull(user)) {
                                        user.makeGlobalAdmin(function (err, result) {
                                            return callback(err, result);
                                        });
                                    }
                                    else {
                                        console.log("Non-existent user " + username + ". Creating new for promoting to admin.");

                                        User.createAndInsertFromObject({
                                                foaf: {
                                                    mbox: mbox,
                                                    firstName: firstname,
                                                    surname: surname
                                                },
                                                ddr: {
                                                    username: username,
                                                    password: password
                                                }
                                            },
                                            function (err, newUser) {
                                                if (!err && !isNull(newUser) && newUser instanceof User) {
                                                    newUser.makeGlobalAdmin(function (err, newUser) {
                                                        return callback(err, newUser);
                                                    });
                                                }
                                                else {
                                                    const msg = "Error creating new User" + JSON.stringify(newUser);
                                                    console.error(msg);
                                                    return callback(err, msg);
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

                                return callback(err);
                            });
                        }
                    ],
                    function(err, results){
                        if(!err)
                        {
                            return callback(null);
                        }
                        else
                        {
                            process.exit(1);
                        }
                    });
            }
            else
            {
                return callback(null);
            }
        }],
        function(err, results)
        {
            return callback(err, results);
        }
    );
};


async.series([
    function(cb)
    {
        init(cb);
    },
    function(cb)
    {
        if(Config.startup.load_databases)
        {
            loadData(cb);
        }
        else
        {
            cb(null);
        }
    },
    function(callback)
    {
        //app's own requires
        const index = require(Config.absPathInSrcFolder("/controllers/index"));
        const users = require(Config.absPathInSrcFolder("/controllers/users"));
        const vertexes = require(Config.absPathInSrcFolder("/controllers/vertexes"));
        const admin = require(Config.absPathInSrcFolder("/controllers/admin"));
        const projects = require(Config.absPathInSrcFolder("/controllers/projects"));
        const files = require(Config.absPathInSrcFolder("/controllers/files"));
        const records = require(Config.absPathInSrcFolder("/controllers/records"));
        const interactions = require(Config.absPathInSrcFolder("/controllers/interactions"));
        const descriptors = require(Config.absPathInSrcFolder("/controllers/descriptors"));
        const evaluation = require(Config.absPathInSrcFolder("/controllers/evaluation"));
        const ontologies = require(Config.absPathInSrcFolder("/controllers/ontologies"));
        const research_domains = require(Config.absPathInSrcFolder("/controllers/research_domains"));
        const repo_bookmarks = require(Config.absPathInSrcFolder("/controllers/repo_bookmarks"));
        const datasets = require(Config.absPathInSrcFolder("/controllers/datasets"));
        const sparql = require(Config.absPathInSrcFolder("/controllers/sparql"));
        const posts = require(Config.absPathInSrcFolder("/controllers/posts"));
        const fileVersions = require(Config.absPathInSrcFolder("/controllers/file_versions"));
        const notifications = require(Config.absPathInSrcFolder("/controllers/notifications"));

        const auth = require(Config.absPathInSrcFolder("/controllers/auth"));
        const auth_orcid = require(Config.absPathInSrcFolder("/controllers/auth_orcid"));

        let recommendation;

        const recommendation_mode = RecommendationUtils.getActiveRecommender();

        if(recommendation_mode === "dendro_recommender")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/dr_recommendation"));
        }
        else if(recommendation_mode === "standalone")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/standalone_recommendation"));
        }
        else if(recommendation_mode === "project_descriptors")
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/project_descriptors_recommendation"));
        }
        else if(recommendation_mode === "none")
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

        const sessionMongoStore = new MongoStore(
            {
                "host": Config.mongoDBHost,
                "port": Config.mongoDbPort,
                "db": Config.mongoDBSessionStoreCollection,
                "url": 'mongodb://' + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoDBSessionStoreCollection
            });

        const slug = require('slug');
        const key = "dendro_" + slug(Config.host) + "_sessionKey";
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

        app.use(passport.initialize());
        app.use(passport.session());

        app.use(flash());

        if(Config.debug.active && Config.debug.session.auto_login)
        {
            app.use(signInDebugUser);
        }

        app.use(appendLocalsToUseInViews);

        app.use(require('stylus').middleware(Config.getPathToPublicFolder()));

        app.use(express.static(Config.getPathToPublicFolder()));

        // all environments

        const env = process.env.NODE_ENV || 'development';
        if ('development' === env)
        {
            app.set('title', 'Dendro');
            app.set('theme', Config.theme);
        }

        //		development only
        if ('development' === app.get('env')) {
            app.use(errorHandler({
                secret: appSecret,
                resave: true,
                saveUninitialized: true
            }));
        }

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, true, {
            docExpansion : "list"
        }));

        const loadRoutes = require(Config.absPathInSrcFolder("bootup/routes/load_routes.js")).loadRoutes;
        
        loadRoutes(app, passport, function(err, result){
            PluginManager.registerPlugins(app, function(err, app){
                //The 404 Route (ALWAYS Keep this as the last route)
                // ERRO! Isto entra em conflito com as rotas dos plugins, porque esta é registada antes do registo das rotas dos
                //plugins ter sido concluído

                /*app.get('*', function(req, res){
                 res.render('errors/404', 404);
                 });*/


                const server = http.createServer(function (req, res) {

                    const reqd = domain.create();
                    reqd.add(req);
                    reqd.add(res);

                    // On error dispose of the domain
                    reqd.on('error', function (error) {
                        console.error('Error!\n' + "Code: \n" + error.code + " \nMessage: \n" + error.message + "Request URL: \n" + req.originalRequestUrl);

                        if (!isNull(error.stack)) {
                            const util = require('util');
                            console.error('Stack Trace : ' + util.format(error.stack));
                        }

                        reqd.dispose();
                    });

                    // Pass the request to express
                    app(req, res)

                });

                //dont start server twice (for testing)
                //http://www.marcusoft.net/2015/10/eaddrinuse-when-watching-tests-with-mocha-and-supertest.html

                if(process.env.NODE_ENV !== 'test')
                {
                    server.listen(app.get('port'), function() {
                        const npid = require('npid');
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

                        console.log('Express server listening on port ' + app.get('port'));
                        const appInfo = {server: server, app: app};
                        bootupPromise.resolve(appInfo);
                    });
                }
                else
                {
                    console.log('Express server listening on port ' + app.get('port') + " in TEST Mode");
                    var appInfo = {server: server, app: app};
                    bootupPromise.resolve(appInfo);
                }

                if(Config.debug.diagnostics.ram_usage_reports)
                {
                    setInterval(function ()
                    {
                        const pretty = require('prettysize');
                        console.log("[" + Config.version.name + "] RAM Usage : " + pretty(process.memoryUsage().rss));    //log memory usage
                        if (typeof gc === 'function')
                        {
                            gc();
                            gc();
                        }
                    }, 2000);
                }

                // Handle 404
                app.use(function(req, res) {
                    let acceptsHTML = req.accepts('html');
                    const acceptsJSON = req.accepts('json');
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
                    let acceptsHTML = req.accepts('html');
                    const acceptsJSON = req.accepts('json');
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
                    let acceptsHTML = req.accepts('html');
                    const acceptsJSON = req.accepts('json');
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
        });

        /**
         * Register plugins
         */
    }
]);

exports.bootup = bootupPromise.promise;
exports.connectionsInitialized = connectionsInitializedPromise.promise;