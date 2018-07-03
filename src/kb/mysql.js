const mysql = require("mysql");
const async = require("async");

const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

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

DendroMySQLClient.prototype.releaseConnection = function (connection, callback)
{
    const self = this;
    connection.commit(function (err, result)
    {
        self.pool.release(connection, function (err, result)
        {
            if (err)
            {
                Logger.log("error", "Error releasing connection to MySQL on database " + self.hostname + ":" + self.port + " " + self.db);
                Logger.log("error", err);
                Logger.log("error", result);
            }

            callback(err, result);
        });
    });
};

DendroMySQLClient.prototype.getConnection = function (callback)
{
    const self = this;
    let connection;
    async.waterfall([
        function (cb)
        {
            if (self.pool)
            {
                cb(null);
            }
            else
            {
                self.pool = mysql.createPool({
                    host: self.hostname,
                    user: self.user,
                    password: self.password,
                    database: self.db,
                    multipleStatements: true
                });

                cb(null);
            }
        },
        function (cb)
        {
            const getConnectionFromPool = function (cb)
            {
                self.pool.getConnection(function (err, retrievedConnection)
                {
                    connection = retrievedConnection;
                    cb(null, isNull(err));
                });
            };

            // try calling apiMethod 10 times with linear backoff
            // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
            async.retry({
                times: 240,
                interval: function (retryCount)
                {
                    const msecs = 500;
                    Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to MySQL...");
                    return msecs;
                }
            },
            getConnectionFromPool,
            function (err, result)
            {
                cb(err, result);
            });
        }
    ], function (err, result)
    {
        callback(err, connection);
    });
};

DendroMySQLClient.prototype.createDatabaseIfNotExists = function (callback)
{
    const self = this;
    if (!self._databaseExists)
    {
        const connection = mysql.createConnection({
            host: self.hostname,
            user: self.user,
            password: self.password,
            multipleStatements: true
        });

        connection.query("CREATE DATABASE IF NOT EXISTS " + self.db + ";\n", function (err, result)
        {
            if (!isNull(err))
            {
                Logger.log("error", "Error creating database in MySQL: " + self.db);
            }

            connection.end(function (err, result)
            {
                if (!err)
                {
                    self._databaseExists = true;
                }

                callback(err, result);
            });
        });
    }
    else
    {
        callback(null);
    }
};

DendroMySQLClient.prototype.checkAndCreateInteractionsTable = function (tablename, callback)
{
    const self = this;

    self.getConnection(function (err, connection)
    {
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
                                Logger.log("Interactions table " + tablename + " successfully created in the MySQL database.");

                                connection.release();
                                if (isNull(err))
                                {
                                    Logger.log("Indexes on table  " + tablename + " successfully created in the MySQL database.");
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
    });
};

DendroMySQLClient.prototype.releaseAllConnections = function (callback)
{
    const self = this;
    self.pool.end(callback);
};

module.exports.DendroMySQLClient = DendroMySQLClient;
