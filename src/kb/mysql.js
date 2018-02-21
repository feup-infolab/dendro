const path = require("path");
const mysql = require("mysql");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
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
}

DendroMySQLClient.prototype.getConnection = function ()
{
    const self = this;
    const handleDisconnect = function ()
    {
        const connection = mysql.createConnection({
            host: self.hostname,
            port: self.port,
            database: self.db,
            user: self.user,
            password: self.password
        });

        connection.on("error", function (err)
        {
            Logger.log("error", "DB error : " + JSON.stringify(err));
            if (err.code === "PROTOCOL_CONNECTION_LOST")
            {
                return handleDisconnect();
            }

            throw new Error("[ERROR] Error on MySQL Database server running on " + self.mySQLHost + ":" + self.mySQLPort + "\n Error description : " + err);
        });

        return connection;
    };

    return handleDisconnect();
};

DendroMySQLClient.prototype.createDatabaseIfNotExists = function (callback)
{
    const self = this;
    const connection = self.getConnection();

    connection.connect(
        function (err, result)
        {
            if (isNull(err))
            {
                callback(null);
            }
            else
            {
                if (err.code === "ER_BAD_DB_ERROR")
                {
                    connection.query("CREATE DATABASE IF NOT EXISTS " + self.db + ";\n", function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error creating database in MySQL: " + self.db); // Config.mySQLDBName
                        }
                        connection.end();
                        callback(err, result);
                    });
                }
                else
                {
                    callback(err, result);
                }
            }
        }
    );
};

DendroMySQLClient.prototype.connect = function (callback)
{
    const self = this;
    const connection = self.getConnection();

    connection.connect(function (err)
    {
        if (err)
        {
            Logger.log("Error connecting to MySQL at " + self.hostname + ":" + err.stack);
            return;
        }

        Logger.log("Connected to MySQL as id " + connection.threadId);
        connection.end();
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
