const path = require('path');

let Pathfinder;
if(process.env.NODE_ENV === "test")
{
    const appDir = path.resolve(path.dirname(require.main.filename), "../../..");
    Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
    Pathfinder.appDir = appDir;
    console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);
}
else
{
    const appDir = path.resolve(path.dirname(require.main.filename), "../");
    Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
    Pathfinder.appDir = path.resolve(path.dirname(require.main.filename), "..");
    Pathfinder.appDir = appDir;
    console.log("Running in production / dev mode and the app directory is : " + Pathfinder.appDir);
}

const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

/**
 * Module dependencies.
 */

let express = require('express'),
    domain = require('domain'),
    passport = require('passport'),
    flash = require('connect-flash'),
    http = require('http'),
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
    colors = require('colors'),
    swaggerDocument = YAML.load(Pathfinder.absPathInApp("swagger.yaml"));

let bootupPromise = Q.defer();
let connectionsInitializedPromise = Q.defer();

let app = express();

let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
let IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
let DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
let GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
let PluginManager = Object.create(require(Pathfinder.absPathInSrcFolder("/plugins/plugin_manager.js")).PluginManager);
let Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
let Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
let UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
let RecommendationUtils = require(Pathfinder.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;
let User = require('./models/user.js').User;

let async = require('async');
let util = require('util');
let mkdirp = require('mkdirp');
let pid;
let registeredUncaughtExceptionHandler;

const log_boot_message = function(type, message)
{
    let intro = "[MISC]".cyan;
    if(Config.startup.log_bootup_actions)
    {
        if(type === "info")
        {
            intro = "[INFO]".blue;
        }
        else if(type === "success")
        {
            intro = "[OK]".green;
        }

        console.log(intro + " " + message);
    }
};

const MongoStore = require('connect-mongo')(expressSession);

const sessionMongoStore = new MongoStore(
    {
        "host": Config.mongoDBHost,
        "port": Config.mongoDbPort,
        "db": Config.mongoDBSessionStoreCollection,
        "url": 'mongodb://' + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoDBSessionStoreCollection
    });

//Setup logging
if(!isNull(Config.logging))
{
    async.series([
        function(cb)
        {
            if (!isNull(Config.logging.app_logs_folder) && (Config.logging.pipe_console_to_logfile || Config.logging.suppress_all_logs || Config.logging.suppress_all_errors))
            {
                const absPath = Pathfinder.absPathInApp(Config.logging.app_logs_folder);

                fs.exists(absPath, function (exists)
                {
                    if (!exists)
                    {
                        try
                        {
                            mkdirp.sync(absPath);
                            log_boot_message("success", "Temp uploads folder " + absPath + " created.");
                        }
                        catch (e)
                        {
                            throw new Error("[FATAL] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(e));
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
                const absPath = Pathfinder.absPathInApp(Config.logging.app_logs_folder);

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

                            if (isNull(err))
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
            throw new Error("Unable to setup logging!");
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
    log_boot_message("info", "Temp uploads folder " + tempUploadsFolder + " does not exist. Creating...");
    try{
        mkdirp.sync(tempUploadsFolder);
        log_boot_message("success", "Temp uploads folder " + tempUploadsFolder + " created.");
    }
    catch(e)
    {
        throw new Error("[FATAL] Unable to create temporary uploads directory at " + tempUploadsFolder + "\n Error : " + JSON.stringify(e));
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
                if (isNull(err)) {
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
    const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

    //append request and session to use directly in views and avoid passing around needless stuff
    res.locals.request = req;
    res.locals.baseURI = Config.baseUri;

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

log_boot_message("info", "Welcome! Booting up a Dendro Node on this machine");
log_boot_message("info", "Starting Dendro support services...");

const init = function(callback)
{
    async.waterfall([
        function(callback) {
            let db = new DbConnection(
                Config.virtuosoHost,
                Config.virtuosoPort,
                Config.virtuosoAuth.user,
                Config.virtuosoAuth.password,
                Config.maxSimultaneousConnectionsToDb);

            db.create(function(db) {
                if(!db)
                {
                    throw new Error("[ERROR] Unable to connect to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);
                }
                else
                {
                    log_boot_message("success", "Connected to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);

                    //set default connection. If you want to add other connections, add them in succession.
                    Config.db.default.connection = db;

                    return callback(null);
                }
            });
        },
        function(callback) {
            if(Config.startup.load_databases && Config.startup.destroy_all_graphs_on_startup)
            {
                const graphs = Object.keys(Config.db);
                const conn = Config.getDBByID().connection;

                async.map(graphs, function(graph, cb){

                    const graphUri = Config.getDBByID(graph).graphUri;
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
                                    throw new Error("Tried to delete graph " + graphUri + " but it still exists!");
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
                const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
                Cache.initConnections(function(err, result){
                    callback(err);
                }, Config.startup.clear_caches);
            }
            else
            {
                log_boot_message("info","Cache not active in deployment configuration. Continuing Dendro startup without connecting to any cache servers.");
                return callback(null);
            }
        },
        function(callback) {
            log_boot_message("info","Loading ontology parametrization from database... ");

            const Ontology = require(Pathfinder.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;

            if(Config.startup.load_databases && Config.startup.reload_ontologies_on_startup)
            {
                Ontology.initAllFromDatabase(function (err, ontologies)
                {
                    if (isNull(err))
                    {
                        Config.allOntologies = ontologies;
                        log_boot_message("success","Ontology information successfully loaded from database.");
                        return callback(null);
                    }
                    else
                    {
                        throw new Error("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system.");
                    }
                });
            }
            else
            {
                Ontology.all(function(err, ontologies){
                    if(isNull(err))
                    {
                        Config.allOntologies = ontologies;
                        return callback(null);
                    }
                    else
                    {
                        throw new Error("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system from cache.");
                    }

                });
            }
        },
        function(callback) {

            log_boot_message("info","Checking ontology and descriptor parametrizations...");

            Descriptor.validateDescriptorParametrization(function(err, result)
            {
                if(isNull(err))
                {
                    log_boot_message("success","All ontologies and descriptors seem correctly set up.");
                    return callback(null);
                }
                else
                {
                    throw new Error("[ERROR] Errors were detected while checking the configuration of descriptors and/or ontologies in the system.");
                }
            });
        },
        function(callback) {
            log_boot_message("info","Connecting to ElasticSearch Cluster...");
            self.index = new IndexConnection();

            self.index.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection.indexes.dendro, function(index) {
                if(index.client)
                {
                    log_boot_message("info","Created connection to ElasticSearch Cluster on "+ Config.elasticSearchHost + ":" + Config.elasticSearchPort +" but did not try to connect yet");
                }
                else
                {
                    throw new Error("[ERROR] Unable to create connection to index " + IndexConnection.indexes.dendro.short_name);
                }
                return callback(null);
            });
        },
        function(callback) {
            log_boot_message("info","Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");
            self.index.create_new_index(1, 1, false, function(error,result)
            {
                if(!isNull(error))
                {
                    throw new Error("[ERROR] Unable to create or link to index " + IndexConnection.indexes.dendro.short_name);
                }
                else
                {
                    log_boot_message("ok","Indexes are up and running on "+ Config.elasticSearchHost + ":" + Config.elasticSearchPort);
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
                    throw new Error("[ERROR] Unable to connect to MongoDB file storage cluster running on " + Config.mongoDBHost + ":" + Config.mongoDbPort + "\n Error description : " + gfsConn);
                }
                else
                {
                    log_boot_message("ok","Connected to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
                    Config.gfs.default.connection = gfs;
                    return callback(null);
                }
            });
        },
        function(callback) {
            const testDRConnection = function (callback) {
                log_boot_message("info","Testing connection to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " ...");
                const needle = require("needle");

                const checkUri = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/about";
                // using callback
                needle.get(checkUri, {
                        accept: "application/json"
                    },
                    function (error, response) {
                        if (isNull(error)) {
                            log_boot_message("success","Successfully connected to Dendro Recommender instance, version " + response.body.version + " at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " :-)");
                            return callback(null);
                        }
                        else {
                            throw new Error("[ERROR] Unable to connect to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "! Aborting startup.");
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
                    log_boot_message("success","Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
                    Config.mysql.default.pool = pool;
                    return callback(null);
                };

                //connection.connect(function (err)
                pool.getConnection(function (err, connection) {
                    const freeConnectionsIndex = pool._freeConnections.indexOf(connection);
                    if (isNull(err)) {
                        const checkAndCreateTable = function (tablename, cb) {
                            connection.query("SHOW TABLES LIKE '" + tablename + "';", function (err, result, fields) {
                                if (isNull(err)) {
                                    if (result.length > 0) {
                                        log_boot_message("info","Interactions table " + tablename + " exists in the MySQL database.");
                                        poolOK(pool);
                                    }
                                    else {
                                        log_boot_message("info","Interactions table does not exists in the MySQL database. Attempting creation...");

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

                                        log_boot_message("info","Interactions table " + tablename + " does not exist in the MySQL database. Running query for creating interactions table... \n" + createTableQuery);

                                        connection.query(
                                            createTableQuery,
                                            function (err, result, fields) {
                                                connection.release();
                                                if (isNull(err)) {
                                                    log_boot_message("info","Interactions table " + tablename + " succesfully created in the MySQL database.");

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
                                                            if (isNull(err)) {
                                                                log_boot_message("info","Indexes on table  " + tablename + " succesfully created in the MySQL database.");
                                                                cb(null, null);
                                                            }
                                                            else {
                                                                throw new Error("[ERROR] Unable to create indexes on table  " + tablename + " in the MySQL database. Query was: \n" + createIndexesQuery + "\n . Result was: \n" + result);
                                                            }
                                                        });
                                                }
                                                else {
                                                    throw new Error("[ERROR] Unable to create the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                                }
                                            });
                                    }
                                }
                                else {
                                    throw new Error("[ERROR] Unable to query for the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                }
                            });
                        };

                        const table_to_write_recommendations = Config.recommendation.getTargetTable();

                        checkAndCreateTable(table_to_write_recommendations, function (err, results) {
                            if (err) {
                                throw new Error("Unable to create table "+table_to_write_recommendations+" in MySQL ");
                            }
                            else {
                                poolOK(connection);
                            }
                        });
                    }
                    else {
                        throw new Error("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
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
                        if (isNull(err))
                        {
                            return callback(null);
                        }
                    });
            }
            else
            {
                throw new Error("[ERROR] No descriptor recommendation mode set up in deployment config: " + JSON.stringify(Config.recommendation) + ". Set up only one as active. ABORTING Startup.");
            }
        },
        function(callback) {
            log_boot_message("info","Setting up temporary files directory at " + Config.tempFilesDir);

            async.waterfall([
                function(cb)
                {
                    if(Config.debug.files.delete_temp_folder_on_startup)
                    {
                        log_boot_message("info","Deleting temp files dir at " + Config.tempFilesDir);
                        const fsextra = require('fs-extra');
                        fsextra.remove(Config.tempFilesDir, function (err) {
                            if(isNull(err))
                            {
                                log_boot_message("success","Deleted temp files dir at " + Config.tempFilesDir);
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
                                log_boot_message("success","Temporary files directory successfully created at " + Config.tempFilesDir);
                                cb();
                            }
                            catch(e)
                            {
                                console.error("[ERROR] Unable to create temporary files directory at " + Config.tempFilesDir);
                                throw e;
                            }
                        }
                        else
                        {
                            cb(null);
                        }
                    });
                }
            ], function(err){
                if(isNull(err))
                {
                    log_boot_message("success","Temporary files directory successfully set up at " + Config.tempFilesDir);
                    return callback(null);
                }
                else
                {
                    throw new Error("[ERROR] Unable to set up files directory at " + Config.tempFilesDir);
                }
            });
        }
    ],function(err, results)
    {
        if(isNull(err))
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
                const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
                User.findByUsername(demoUser.username, function (err, user) {

                    if (isNull(err)) {
                        if (isNull(user)) {
                            //everything ok, user simply does not exist
                            return callback(null, null);
                        }
                        else {
                            log_boot_message("info","Demo user with username " + user.ddr.username + " found. Attempting to delete...");
                            user.deleteAllMyTriples(function (err, result) {
                                return callback(err, result);
                            });
                        }
                    }
                    else {
                        console.error("[ERROR] Unable to delete user with username " + demoUser.username + ". Error: " + user);
                        return callback(err, user);
                    }
                });
            };
            if(Config.demo_mode.active)
            {
                if (Config.startup.load_databases && Config.startup.reload_demo_users_on_startup)
                {
                    async.map(Config.demo_mode.users, deleteUser, function (err, results)
                    {
                        if (isNull(err))
                        {
                            log_boot_message("info", "Existing demo users deleted. ");

                            const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
                            log_boot_message("info", "Loading Demo Users... ");

                            const createUser = function (user, callback)
                            {
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
                                    function (err, newUser)
                                    {
                                        if (isNull(err) && !isNull(newUser))
                                        {
                                            return callback(null, newUser);
                                        }
                                        else
                                        {
                                            console.error("[ERROR] Error creating new demo User ");
                                            console.error(err.stack);
                                            return callback(err, user);
                                        }
                                    });
                            };

                            async.map(Config.demo_mode.users, createUser, function (err, results)
                            {
                                if (isNull(err))
                                {
                                    log_boot_message("info", "Existing demo users recreated. ");
                                    return callback(err);
                                }
                                else
                                {
                                    throw new Error("Unable to create demo users" + JSON.stringify(results));
                                }
                            });
                        }
                        else
                        {
                            return callback(err);
                        }
                    });
                }
                else
                {
                    return callback(null);
                }
            }
        },
        function(callback) {
            if(Config.startup.load_databases && Config.startup.reload_administrators_on_startup)
            {
                const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
                log_boot_message("info","Loading default administrators.");

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

                                    if (isNull(err) && !isNull(user)) {
                                        user.makeGlobalAdmin(function (err, result) {
                                            return callback(err, result);
                                        });
                                    }
                                    else {
                                        log_boot_message("info","Non-existent user " + username + ". Creating new for promoting to admin.");

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
                                                if (isNull(err) && !isNull(newUser) && newUser instanceof User) {
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
                                if(isNull(err))
                                {
                                    log_boot_message("success","Admins successfully loaded.");
                                }
                                else {
                                    console.error("[ERROR] Unable to load admins. Error : " + err);
                                }

                                return callback(err);
                            });
                        }
                    ],
                    function(err, results){
                        if(isNull(err))
                        {
                            return callback(null);
                        }
                        else
                        {
                            throw new Error("Error promoting default admins " + JSON.stringify(results));
                        }
                    });
            }
            else
            {
                return callback(null);
            }
        },
        function(callback) {
            if(Config.startup.clear_session_store)
            {
                log_boot_message("info","Clearing session store!");
                sessionMongoStore.clear(callback);
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
        const index = require(Pathfinder.absPathInSrcFolder("/controllers/index"));
        const users = require(Pathfinder.absPathInSrcFolder("/controllers/users"));
        const vertexes = require(Pathfinder.absPathInSrcFolder("/controllers/vertexes"));
        const admin = require(Pathfinder.absPathInSrcFolder("/controllers/admin"));
        const projects = require(Pathfinder.absPathInSrcFolder("/controllers/projects"));
        const files = require(Pathfinder.absPathInSrcFolder("/controllers/files"));
        const records = require(Pathfinder.absPathInSrcFolder("/controllers/records"));
        const interactions = require(Pathfinder.absPathInSrcFolder("/controllers/interactions"));
        const descriptors = require(Pathfinder.absPathInSrcFolder("/controllers/descriptors"));
        const evaluation = require(Pathfinder.absPathInSrcFolder("/controllers/evaluation"));
        const ontologies = require(Pathfinder.absPathInSrcFolder("/controllers/ontologies"));
        const research_domains = require(Pathfinder.absPathInSrcFolder("/controllers/research_domains"));
        const repo_bookmarks = require(Pathfinder.absPathInSrcFolder("/controllers/repo_bookmarks"));
        const datasets = require(Pathfinder.absPathInSrcFolder("/controllers/datasets"));
        const sparql = require(Pathfinder.absPathInSrcFolder("/controllers/sparql"));
        const posts = require(Pathfinder.absPathInSrcFolder("/controllers/posts"));
        const fileVersions = require(Pathfinder.absPathInSrcFolder("/controllers/file_versions"));
        const notifications = require(Pathfinder.absPathInSrcFolder("/controllers/notifications"));

        const auth = require(Pathfinder.absPathInSrcFolder("/controllers/auth"));
        const auth_orcid = require(Pathfinder.absPathInSrcFolder("/controllers/auth_orcid"));

        let recommendation;

        const recommendation_mode = RecommendationUtils.getActiveRecommender();

        if(recommendation_mode === "dendro_recommender")
        {
            recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/dr_recommendation"));
        }
        else if(recommendation_mode === "standalone")
        {
            recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/standalone_recommendation"));
        }
        else if(recommendation_mode === "project_descriptors")
        {
            recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/project_descriptors_recommendation"));
        }
        else if(recommendation_mode === "none")
        {
            recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/no_recommendation"));
        }

        app.use(appendIndexToRequest);

        // all environments
        app.set('port', process.env.PORT || Config.port);
        app.set('views', Pathfinder.absPathInSrcFolder('/views'));

        app.set('view engine', 'ejs');
        app.set('etag', 'strong');

        app.use(favicon(Pathfinder.absPathInPublicFolder("images/logo_micro.png")));

        //app.use(express.logger('dev'));

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());


        app.use(methodOverride());

        app.use(cookieParser(appSecret));

        const slug = require('slug');
        const key = "dendro_" + slug(Config.host) + "_sessionKey";
        app.use(expressSession(
            {
                secret: appSecret,
                genid: function(){ const uuid = require('uuid'); return uuid.v4() },
                key: key,
                cookie: { maxAge: 1000 * 60 * 60 * 24 * 5 }, //5 days max session age
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

        app.use(require('stylus').middleware(Pathfinder.getPathToPublicFolder()));

        app.use(express.static(Pathfinder.getPathToPublicFolder()));

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

        const loadRoutes = require(Pathfinder.absPathInSrcFolder("bootup/routes/load_routes.js")).loadRoutes;

        loadRoutes(app, passport, recommendation, function(err, result){
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
                        pid = npid.create(Pathfinder.absPathInApp('running.pid'), true); //second arg = overwrite pid if exists

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
                    const appInfo = {server: server, app: app};
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