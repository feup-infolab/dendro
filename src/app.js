/**
 * Initialize configuration first before everything else (will init global connections (DB, storage, etc).
 *
 * @type {Function}
 */
var Config = Object.create(require("./models/meta/config.js").Config);
Config.initGlobals();

/**
 * Module dependencies.
 */

var express = require('express'),
    domain = require('domain'),
    serverDomain = domain.create(),
    flash = require('connect-flash'),
    http = require('http'),
    path = require('path');
    fs = require('fs');
    morgan = require('morgan');

var app = express();

var IndexConnection = require(Config.absPathInSrcFolder("/kb/index.js")).IndexConnection;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var GridFSConnection = require(Config.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
var RedisConnection = require(Config.absPathInSrcFolder("/kb/redis.js")).RedisConnection;
var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);
var PluginManager = Object.create(require(Config.absPathInSrcFolder("/plugins/plugin_manager.js")).PluginManager);
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

var async = require('async');
var util = require('util');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();


var self = this;

var appSecret = '891237983kjjhagaGSAKPOIOHJFDSJHASDKLASHDK1987123324ADSJHXZ_:;::?=?)=)';


if(Config.logging != null)
{
    var FileStreamRotator = require('file-stream-rotator');
    var mkpath = require('mkpath');

    if(Config.logging.format != null && Config.logging.app_logs_folder != null)
    {
        var absPath = Config.absPathInApp(Config.logging.app_logs_folder);
        mkpath(absPath, function (err) {
            if(!err)
            {
                var accessLogStream = FileStreamRotator.getStream({
                    date_format: 'YYYYMMDD',
                    filename: path.join(absPath, Config.logging.format + '-%DATE%.log'),
                    frequency: 'daily',
                    verbose: false
                });

                app.use(express.logger({
                    format: Config.logging.format,
                    stream: accessLogStream
                }));
            }
            else
            {
                console.error("[ERROR] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(err));
                process.exit(1);
            }
        });
    }

    if(Config.logging.log_request_times && Config.logging.request_times_log_folder != null)
    {
        var absPath = Config.absPathInApp(Config.logging.request_times_log_folder);

        mkpath(absPath, function (err) {
            var accessLogStream = FileStreamRotator.getStream({
                date_format: 'YYYYMMDD',
                filename: path.join(absPath, 'times-%DATE%.log'),
                frequency: 'daily',
                verbose: false
            });

            if(!err)
            {
                app.use(morgan('combined', {stream: accessLogStream}));
            }
            else
            {
                console.error("[ERROR] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(err));
                process.exit(1);
            }
        });
    }
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
    function(callback) {

        var redisConn = new RedisConnection(
            Config.cache.redis.options,
            Config.cache.redis.database_number
        );

        GLOBAL.redis.default.connection = redisConn;

        if(Config.cache.active)
        {
            redisConn.openConnection(function(err, redisConn) {
                if(err)
                {
                    console.log("[ERROR] Unable to connect to cache service running on " + Config.cache.redis.options.host + ":" + Config.cache.redis.options.port + " : " + err.message);
                    process.exit(1);
                }
                else
                {
                    console.log("[OK] Connected to Redis cache service at " + Config.cache.redis.options.host + ":" + Config.cache.redis.options.port);


                    redisConn.deleteAll(function(err, result){
                        if(!err)
                        {
                            console.log("[INFO] Deleted all cache records during bootup.");
                            callback(null);
                        }
                        else
                        {
                            console.log("[ERROR] Unable to delete all cache records during bootup");
                            process.exit(1);
                        }
                    });
                }
            });
        }
        else
        {
            console.log("[INFO] Cache not active in deployment configuration. Continuing Dendro startup...");
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
            Config.mongoDBAuth.password);

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

        if (Config.recommendation.modes.standalone.active || Config.recommendation.modes.none.active || Config.recommendation.modes.dendro_recommender.active)
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
            console.err("[ERROR] No descriptor recommendation mode set up in deployment config: " + JSON.stringify(Config.recommendation) + ". Set up only one as active. ABORTING Startup.");
            process.exit(1);
        }
    },
    function(callback) {
        var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
        var nfs = require('node-fs');
        var fs = require('fs');

        console.log("[INFO] Setting up temporary files directory at " + Config.tempFilesDir);

        fs.exists(Config.tempFilesDir, function(exists){
            if(!exists)
            {
                nfs.mkdir(Config.tempFilesDir, Config.tempFilesCreationMode, true, function(err)
                {
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
            }
            else
            {
                console.log("[OK] Temporary files directory successfully set up at " + Config.tempFilesDir);
                callback(null);
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
                    console.log("[ERROR] Unable to delete user with username " + username + ". Error: " + user);
                    callback(err, result);
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

        var auth = require(Config.absPathInSrcFolder("/controllers/auth"));

        if(Config.recommendation.modes.dendro_recommender.active)
        {
            var recommendation = require(Config.absPathInSrcFolder("/controllers/dr_recommendation"));
        }
        else if(Config.recommendation.modes.standalone.active)
        {
            var recommendation = require(Config.absPathInSrcFolder("/controllers/standalone_recommendation"));
        }
        else if(Config.recommendation.modes.none.active)
        {
            recommendation = require(Config.absPathInSrcFolder("/controllers/no_recommendation"));
        }

        app.use(appendIndexToRequest);

        // all environments
        app.set('port', process.env.PORT || Config.port);
        app.set('views', Config.absPathInSrcFolder('/views'));

        app.set('view engine', 'ejs');
        app.set('etag', 'strong');

        app.use(express.favicon());

        //app.use(express.logger('dev'));

        app.use(express.bodyParser(
            {
                keepExtensions: true,
                limit: Config.maxUploadSize,
                defer: true
            }
        ));

        app.use(express.methodOverride());

        app.use(express.cookieParser(appSecret));
        app.use(express.session({ secret: appSecret }));
        app.use(flash());

        if(Config.debug.active && Config.debug.session.auto_login)
        {
            app.use(signInDebugUser);
        }

        app.use(appendLocalsToUseInViews);

        app.use(require('stylus').middleware(Config.getPathToPublicFolder()));

        app.use(express.static(Config.getPathToPublicFolder()));

        // all environments
        app.configure(function() {

            /*app.locals({
             title: 'Dendro',
             phone: '1-250-858-9990',
             email: 'me@myapp.com'
             }); */

            app.set('title', 'Dendro');
            app.set('theme', Config.theme);
        });

        //validate permissions before calling the router middleware
        // Authenticator
//        app.use(express.basicAuth(function(user, pass, callback) {
//            var result = (user === 'testUser' && pass === 'testPass');
//            callback(null /* error */, result);
//        }));

        app.use(app.router);

        //		development only
        if ('development' == app.get('env')) {
            app.use(express.errorHandler());
        }

        app.get('/', index.index);

        //nodes
        app.get('/vertexes', async.apply(Permissions.require, [Permissions.acl.admin]), vertexes.all);
        app.get('/vertexes/random', async.apply(Permissions.require, [Permissions.acl.admin]), vertexes.random);
        app.get('/vertexes/show', async.apply(Permissions.require, [Permissions.acl.admin]), vertexes.show);
        app.get('/vertexes/:source/with/:property', async.apply(Permissions.require, [Permissions.acl.admin]), vertexes.with_property);

        //search
        app.get('/search', vertexes.search);

        //admin area
        app.get('/admin', async.apply(Permissions.require, [Permissions.acl.admin]), admin.home);
        app.get('/admin/reindex', async.apply(Permissions.require, [Permissions.acl.admin]), admin.reindex);
        app.get('/admin/reload', async.apply(Permissions.require, [Permissions.acl.admin]), admin.reload);

        //low-level sparql endpoint
        app.get('/sparql', async.apply(Permissions.require, [Permissions.acl.admin]), sparql.show);

        //authentication
        app.get('/login', auth.login);
        app.post('/login', auth.login);

        //ontologies

        app.get('/ontologies/public', ontologies.public);
        //app.get('/ontologies/all', async.apply(Permissions.require, [Permissions.acl.user]), ontologies.all);
        app.get('/ontologies/all', ontologies.all);
        app.get('/ontologies/autocomplete', async.apply(Permissions.require, [Permissions.acl.user]), ontologies.ontologies_autocomplete);
        app.get('/ontologies/show/:prefix', async.apply(Permissions.require, [Permissions.acl.user]), ontologies.show);
        app.post('/ontologies/edit', async.apply(Permissions.require, [Permissions.acl.admin]), ontologies.edit);

        //descriptors
        app.get('/descriptors/from_ontology/:ontology_prefix', async.apply(Permissions.require, [Permissions.acl.user]), descriptors.from_ontology);

        //research domains

        app.get('/research_domains/autocomplete', async.apply(Permissions.require, [Permissions.acl.user]), research_domains.autocomplete);
        app.get('/research_domains', async.apply(Permissions.require, [Permissions.acl.user]), research_domains.all);
        app.post('/research_domains', async.apply(Permissions.require, [Permissions.acl.admin]), research_domains.edit);
        app.delete('/research_domains/:uri', async.apply(Permissions.require, [Permissions.acl.admin]), research_domains.delete);

        //  registration and login
        app.get('/register', auth.register);
        app.post('/register', auth.register);
        app.get('/logout', async.apply(Permissions.require, [Permissions.acl.user]), auth.logout);

        //people listing
        app.get('/users', users.all);
        app.get('/user/:username', async.apply(Permissions.require, [Permissions.acl.user]), users.show);

        app.all('/reset_password', users.reset_password);
        app.all('/set_new_password', users.set_new_password);

        app.get('/me', async.apply(Permissions.require, [Permissions.acl.user]), users.me);

        //projects
        app.get('/projects', async.apply(Permissions.require, [Permissions.acl.user]), projects.all);
        app.get('/projects/my', async.apply(Permissions.require, [Permissions.acl.user]), projects.my);
        app.get('/projects/new', async.apply(Permissions.require, [Permissions.acl.user]), projects.new);
        app.post('/projects/new', async.apply(Permissions.require, [Permissions.acl.user]), projects.new);

        app.get('/projects/import', async.apply(Permissions.require, [Permissions.acl.user]), projects.import);
        app.post('/projects/import', multipartyMiddleware, async.apply(Permissions.require, [Permissions.acl.user]), projects.import);

        app.get('/project/:handle/request_access', async.apply(Permissions.require, [Permissions.acl.user]), projects.requestAccess);
        app.get('/project/:handle/view', projects.show);
        app.post('/project/:handle/request_access', async.apply(Permissions.require, [Permissions.acl.user]), projects.requestAccess);
        app.post('/project/:handle/delete', async.apply(Permissions.require, [Permissions.acl.admin]), projects.delete);
        app.post('/project/:handle/undelete', async.apply(Permissions.require, [Permissions.acl.admin]), projects.undelete);

        //interactions
        app.post("/interactions/accept_descriptor_from_quick_list", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_quick_list);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_project_favorite);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_favorite);
        app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);


        app.post("/interactions/accept_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_manual_list);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_project_favorite);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_favorite);
        app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);

        app.post("/interactions/hide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.acl.user]), interactions.hide_descriptor_from_quick_list_for_project);
        app.post("/interactions/unhide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.acl.user]), interactions.unhide_descriptor_from_quick_list_for_project);
        app.post("/interactions/hide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.acl.user]), interactions.hide_descriptor_from_quick_list_for_user);
        app.post("/interactions/unhide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.acl.user]), interactions.unhide_descriptor_from_quick_list_for_user);
        app.post("/interactions/favorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.acl.user]), interactions.favorite_descriptor_from_quick_list_for_project);
        app.post("/interactions/favorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.acl.user]), interactions.favorite_descriptor_from_quick_list_for_user);

        app.post("/interactions/unfavorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.acl.user]), interactions.unfavorite_descriptor_from_quick_list_for_user);
        app.post("/interactions/unfavorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.acl.user]), interactions.unfavorite_descriptor_from_quick_list_for_project);

        app.post("/interactions/accept_descriptor_from_autocomplete", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_descriptor_from_autocomplete);
        app.post("/interactions/reject_ontology_from_quick_list", async.apply(Permissions.require, [Permissions.acl.user]), interactions.reject_ontology_from_quick_list);
        app.post("/interactions/select_ontology_manually", async.apply(Permissions.require, [Permissions.acl.user]), interactions.select_ontology_manually);
        app.post("/interactions/select_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.acl.user]), interactions.select_descriptor_manually);

        app.post("/interactions/accept_smart_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_smart_descriptor_in_metadata_editor);
        app.post("/interactions/accept_favorite_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.accept_favorite_descriptor_in_metadata_editor);

        app.post("/interactions/delete_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.delete_descriptor_in_metadata_editor);

        app.post("/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_manual_list_in_metadata_editor);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite);
        app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);


        app.post("/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_quick_list_in_metadata_editor);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite);
        app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

        app.post("/interactions/fill_in_inherited_descriptor", async.apply(Permissions.require, [Permissions.acl.user]), interactions.fill_in_inherited_descriptor);


        app.delete("/interactions/delete_all", async.apply(Permissions.require, [Permissions.acl.admin]), interactions.delete_all_interactions);

        //external repository bookmarks
        app.get('/external_repositories/types', async.apply(Permissions.require, [Permissions.acl.user]), repo_bookmarks.repository_types);
        app.get('/external_repositories/my', async.apply(Permissions.require, [Permissions.acl.creator_or_contributor]), repo_bookmarks.my);
        app.get('/external_repositories', async.apply(Permissions.require, [Permissions.acl.admin]), repo_bookmarks.all);
        app.post('/external_repositories/sword_collections', async.apply(Permissions.require, [Permissions.acl.user]), datasets.sword_collections);
        app.post('/external_repositories/new', async.apply(Permissions.require, [Permissions.acl.user]), repo_bookmarks.new);
        app.delete('/external_repository/:username/:title', async.apply(Permissions.require, [Permissions.acl.creator_or_contributor]), repo_bookmarks.delete);

        //view a project's root
        app.all(/\/project\/([^\/]+)(\/data)?$/,
            async.apply(Permissions.project_access_override, [Permissions.resource_access_levels.public], [Permissions.acl.creator_or_contributor]),
            function(req,res)
            {
                req.params.handle = req.params[0];                      //project handle
                req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle;

                if(req.originalMethod == "GET")
                {
                    if(req.query.download != null || req.query.backup != null || req.query.bagit != null)
                    {
                        req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle + "/data";
                        files.download(req, res);
                        return; //<<<<< WHEN RUNNING PIPED COMMANDS (STREAMED) THIS IS NECESSARY!!!!
                        // OR ELSE SIMULTANEOUS DOWNLOADS WILL CRASH ON SECOND REQUEST!!! JROCHA
                    }
                    else if(req.query.ls != null)
                    {
                        files.ls(req, res);
                    }
                    else if(req.query.metadata_recommendations != null)
                    {
                        recommendation.recommend_descriptors(req, res);
                    }
                    else if(req.query.recent_changes != null)
                    {
                        projects.recent_changes(req, res);
                    }
                    else if(req.query.stats != null)
                    {
                        projects.stats(req, res);
                    }
                    else if(req.query.recommendation_ontologies != null)
                    {
                        ontologies.get_recommendation_ontologies(req, res);
                    }
                    else if(req.query.version != null)
                    {
                        records.show_version(req, res);
                    }
                    else if(req.query.administer != null)
                    {
                        projects.administer(req, res);
                    }
                    else if(req.query.descriptor_autocomplete != null)
                    {
                        descriptors.descriptors_autocomplete(req, res);
                    }
                    else if(req.query.ontology_autocomplete != null)
                    {
                        ontologies.ontologies_autocomplete(req, res);
                    }
                    else if(req.query.thumbnail != null)
                    {
                        files.serve_static(req, res, "images/icons/folder.png", "images/icons/file.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                        return;
                    }
                    else
                    {
                        projects.show(req, res);
                    }
                }
                else if(req.originalMethod == "POST")
                {
                    if(req.query.update_metadata != null)
                    {
                        req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle;
                        records.update(req,res);
                    }
                    else if(req.query.restore_metadata_version != null)
                    {
                        records.restore_metadata_version(req, res);
                    }

                    else if(req.query.mkdir != null)
                    {
                        req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle + "/data";
                        files.mkdir(req, res);
                    }
                    else if(req.query.upload != null)
                    {
                        req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle + "/data";
                        files.upload(req, res);
                    }
                    else if(req.query.restore != null)
                    {
                        req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle + "/data";
                        files.restore(req, res);
                    }
                    else if(req.query.administer != null)
                    {
                        projects.administer(req, res);
                    }
                    else if(req.query.export_to_repository != null)
                    {
                        datasets.export_to_repository(req, res);
                    }
                }
        });

        //      files and folders (data)
        //      downloads
        app.all(/\/project\/([^\/]+)(\/data\/.*)$/,
            async.apply(Permissions.project_access_override, [Permissions.project.public], [Permissions.acl.creator_or_contributor]),
            function(req,res)
            {
                req.params.handle = req.params[0];                      //project handle
                req.params.requestedResource = Config.baseUri + "/project/" + req.params.handle;

                req.params.filepath = req.params[1];   //relative path encodeuri needed because of spaces in filenames
                req.params.requestedResource = req.params.requestedResource + req.params.filepath;

                if(req.originalMethod == "GET")
                {
                    if(req.query.download != null || req.query.backup != null || req.query.bagit != null)
                    {
                        files.download(req, res);
                        return; //<<<<< WHEN RUNNING PIPED COMMANDS (STREAMED) THIS IS NECESSARY!!!!
                                // OR ELSE SYMULTANEOUS DOWNLOADS WILL CRASH ON SECOND REQUEST!!! JROCHA
                    }
                    else if(req.query.thumbnail != null)
                    {
                        if(req.params.filepath != null)
                        {
                            var requestedExtension = path.extname(req.params.filepath).replace(".", "");

                            if(requestedExtension == null)
                            {
                                files.serve_static(req, res, "/images/icons/file.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                            }
                            else if(requestedExtension != null && Config.thumbnailableExtensions[requestedExtension] != null)
                            {
                                files.get_thumbnail(req, res);
                            }
                            else if(requestedExtension == "")
                            {
                                files.serve_static(req, res, "/images/icons/folder.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                            }
                            else
                            {
                                files.serve_static(req, res, "/images/icons/extensions/file_extension_" + requestedExtension + ".png", "/images/icons/file.png", Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                            }

                            return; //<<<<< WHEN RUNNING PIPED COMMANDS (STREAMED) THIS IS NECESSARY!!!!
                            // OR ELSE SIMULTANEOUS DOWNLOADS WILL CRASH ON SECOND REQUEST!!! JROCHA
                        }
                        else
                        {
                            files.serve_static(req, res, "/images/icons/file.png", null, Config.cache.static.last_modified_caching, Config.cache.static.cache_period_in_seconds);
                        }
                    }
                    else if(req.query.metadata != null)
                    {
                        if(req.query.deep != null && req.query.deep == 'true'){
                            records.show_deep(req, res);
                        }
                        else {
                            records.show(req, res);
                        }
                    }
                    else if(req.query.parent_metadata != null)
                    {
                        records.show_parent(req, res);
                    }
                    else if(req.query.version != null)
                    {
                        records.show_version(req, res);
                    }
                    else if(req.query.change_log != null)
                    {
                        projects.change_log(req, res);
                    }
                    else if(req.query.metadata_recommendations != null)
                    {
                        recommendation.recommend_descriptors(req, res);
                    }
                    else if(req.query.recommendation_ontologies != null)
                    {
                        ontologies.get_recommendation_ontologies(req, res);
                    }
                    else if(req.query.descriptor_autocomplete != null)
                    {
                        descriptors.descriptors_autocomplete(req, res);
                    }
                    else if(req.query.ontology_autocomplete != null)
                    {
                        ontologies.ontologies_autocomplete(req, res);
                    }
                    else if(req.query.update_metadata != null)
                    {
                        records.update(req, res);
                    }
                    else if(req.query.ls != null)
                    {
                        files.ls(req, res);
                    }
                    else if(req.query.serve != null)
                    {
                        files.serve(req, res);
                    }
                    else if(req.query.serve_base64 != null)
                    {
                        files.serve_base64(req, res);
                    }
                    else if(req.query.data != null)
                    {
                        var requestedExtension = path.extname(req.params.filepath).replace(".", "");

                        if(files.dataParsers[requestedExtension] != null)
                        {
                            files.data(req, res);
                        }
                        else
                        {
                            projects.show(req, res);
                        }
                        return;
                    }
                    else if(req.query.metadata_evaluation != null)
                    {
                        evaluation.metadata_evaluation(req, res);
                    }
                    else
                    {
                        projects.show(req, res);
                    }
                }
                else if(req.originalMethod == "POST")
                {
                    if(req.query.update_metadata != null)
                    {
                        records.update(req,res);
                    }
                    else if(req.query.restore_metadata_version != null)
                    {
                        records.restore_metadata_version(req, res);
                    }
                    else if(req.query.register_interaction != null)
                    {
                        interactions.register(req, res);
                    }
                    else if(req.query.remove_recommendation_ontology != null)
                    {
                        interactions.reject_ontology_from_quick_list(req, res);
                    }
                    else if(req.query.mkdir != null)
                    {
                        files.mkdir(req, res);
                    }
                    else if(req.query.upload != null)
                    {
                        files.upload(req, res);
                    }
                    else if(req.query.restore != null)
                    {
                        files.restore(req, res);
                    }
                    else if(req.query.undelete != null)
                    {
                        files.undelete(req, res);
                    }
                    else if(req.query.export_to_repository != null)
                    {
                        datasets.export_to_repository(req, res);
                    }
                }
                else if(req.originalMethod == "DELETE")
                {
                    files.rm(req, res);
                }
            }
        );

        //      social
        app.get('/posts/all', async.apply(Permissions.require, [Permissions.acl.user]), posts.all);
        app.post('/posts/new', async.apply(Permissions.require, [Permissions.acl.user]), posts.new);

        //serve angularjs ejs-generated html partials
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

        app = PluginManager.registerPlugins(app);

        //The 404 Route (ALWAYS Keep this as the last route)
        // ERRO! Isto entra em conflito com as rotas dos plugins, porque esta é registada antes do registo das rotas dos
        //plugins ter sido concluído

        /*app.get('*', function(req, res){
            res.render('errors/404', 404);
        });*/


        http.createServer(function (req, res) {

            var reqd = domain.create();
            reqd.add(req);
            reqd.add(res);

            // On error dispose of the domain
            reqd.on('error', function (error) {
                console.error('Error', error.code, error.message, req.url);
                console.error('Stack Trace : ', error.stack);
                reqd.dispose();
            });

            // Pass the request to express
            app(req, res)

        }).listen(app.get('port'), function() {
            console.log('Express server listening on port ' + app.get('port'));
        });

        // Domain for the server (limits number of requests per second), auto restart after crash in certain cases
        serverDomain.run(function () {
        });


        setInterval(function () {
            var pretty = require('prettysize');

            if(Config.debug.diagnostics.ram_usage_reports)
            {
                console.log("[" + Config.version.name + "] RAM Usage : " + pretty(process.memoryUsage().rss));    //log memory usage
            }
            if (typeof gc === 'function') {
                gc();
            }
        }, 2000);
    }
]);
