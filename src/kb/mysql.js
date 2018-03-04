const mysql = require("mysql");
const async = require("async");

const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

function DendroMySQLClient (host, port, db, username, password)
{
    let self = this;
    self.hostname = host;
    self.port = port;
    self.db = db;
    self.user = username;
    self.password = password;

    self._databaseExists = false;
}

DendroMySQLClient.prototype.getConnection = function (omitDatabase)
{
    const self = this;
    const handleDisconnect = function ()
    {
        const parameters = {
            host: self.hostname,
            port: self.port,
            user: self.user,
            password: self.password,
            multipleStatements: true
        };

        if (!omitDatabase)
        {
            parameters.database = self.db;
        }

        const connection = mysql.createConnection(parameters);

        connection.on("error", function (err)
        {
            if (err.code === "PROTOCOL_CONNECTION_LOST")
            {
                return handleDisconnect();
            }

            const msg = "[ERROR] Error on MySQL Database server running on " + self.mySQLHost + ":" + self.mySQLPort + "\n Error description : " + err;
            Logger.log("error", msg);
            throw new Error(msg);
        });

        return connection;
    };

    return handleDisconnect();
};

DendroMySQLClient.prototype.createDatabaseIfNotExists = function (callback)
{
    const self = this;
    const connection = self.getConnection(true);

    if (!self._databaseExists)
    {
        self.connect(
            function (err, result)
            {
                if (!isNull(err))
                {
                    callback(err, result);
                }
                else
                {
                    connection.query("CREATE DATABASE IF NOT EXISTS " + self.db + ";\n", function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error creating database in MySQL: " + self.db);
                        }
                        connection.end();
                        self._databaseExists = true;
                        callback(err, result);
                    });
                }
            },
            true
        );
    }
    else
    {
        callback(null);
    }
};

DendroMySQLClient.prototype.connect = function (callback, omitDatabase)
{
    const self = this;
    const connection = self.getConnection(omitDatabase);

    const tryToConnect = function (callback)
    {
        connection.connect(function (err)
        {
            if (err)
            {
                Logger.log("Error connecting to MySQL at " + self.hostname + ":" + err.stack);
                return;
            }

            Logger.log("Connected to MySQL as id " + connection.threadId);
            callback(err, connection);
        });
    };

    // try calling apiMethod 10 times with linear backoff
    // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
    async.retry({
        times: 10,
        interval: function (retryCount)
        {
            const msecs = 50 * Math.pow(2, retryCount);
            Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to MySQL...");
            return msecs;
        }
    }, tryToConnect, function (err, result)
    {
        callback(err);
    });
};

DendroMySQLClient.prototype.checkAndCreateInteractionsTable = function (tablename, callback)
{
    const self = this;
    const connection = self.getConnection();

    connection.query("SHOW TABLES LIKE '" + tablename + "';", function (err, result, fields)
    {
        if (isNull(err))
        {
            if (result.length > 0)
            {
                Logger.log_boot_message("Interactions table " + tablename + " exists in the MySQL database.");
                callback(null);
            }
            else
            {
                Logger.log_boot_message("Interactions table does not exist in the MySQL database. Attempting creation...");
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
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8; \n" +
                    "\n" +
                    "CREATE INDEX " + tablename + "_uri_text ON " + tablename + "(uri(255)); \n" +
                    "CREATE INDEX " + tablename + "_performedBy_text ON " + tablename + "(performedBy(255)); \n" +
                    "CREATE INDEX " + tablename + "_interaction_type_text ON " + tablename + "(interactionType(255)); \n" +
                    "CREATE INDEX " + tablename + "_executedOver_text ON " + tablename + "(executedOver(255)); \n" +
                    "CREATE INDEX " + tablename + "_originallyRecommendedFor_text ON " + tablename + "(originallyRecommendedFor(255)); \n";

                Logger.log("Interactions table " + tablename + " does not exist in the MySQL database. Running query for creating interactions table... \n" + createTableQuery);

                connection.query(
                    createTableQuery,
                    function (err, result, fields)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Interactions table " + tablename + " succesfully created in the MySQL database.");

                            connection.end();
                            if (isNull(err))
                            {
                                Logger.log("Indexes on table  " + tablename + " succesfully created in the MySQL database.");
                                return callback(null);
                            }

                            return callback("[ERROR] Unable to create indexes on table  " + tablename + " in the MySQL database. Query was: \n" + createTableQuery + "\n . Result was: \n" + JSON.stringify(result, null, 4));
                        }

                        return callback("[ERROR] Unable to create the interactions table " + tablename + " on the MySQL Database server running on " + self.hostname + ":" + self.port + "\n Error description : " + err);
                    }
                );
            }
        }
        else
        {
            return callback("[ERROR] Unable to query for the interactions table " + tablename + " on the MySQL Database server running on " + self.hostname + ":" + self.port + "\n Error description : " + err);
        }
    });
};

module.exports.DendroMySQLClient = DendroMySQLClient;
