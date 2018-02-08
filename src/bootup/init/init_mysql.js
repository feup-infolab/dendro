const fs = require("fs");
const needle = require("needle");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const initMySQL = function (app, callback)
{
    Logger.log_boot_message("Setting up MySQL connection pool.");
    const mysql = require("mysql");

    const createDatabase = function (callback)
    {
        var con = mysql.createConnection({
            host: Config.mySQLHost,
            user: Config.mySQLAuth.user,
            password: Config.mySQLAuth.password
        });

        con.connect(
            function (err, result)
            {
                if (isNull(err))
                {
                    Logger.log_boot_message("Connected to MySQL!");
                    con.query("CREATE DATABASE IF NOT EXISTS " + Config.mySQLDBName + ";\n", function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error creating database in MySQL: " + Config.mySQLDBName);
                        }

                        callback(err, result);
                    });
                }
                else
                {
                    callback(err, result);
                }
            }
        );
    };

    createDatabase(function (err, result)
    {
        let pool;

        if (!isNull(err))
        {
            callback(err, result);
        }

        const poolOK = function (pool)
        {
            Logger.log_boot_message("Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
            Config.mysql.default.pool = pool;
            return callback(null);
        };

        const executeCode = function (err, connection)
        {
            if (isNull(err))
            {
                const checkAndCreateTable = function (tablename, cb)
                {
                    connection.query("SHOW TABLES LIKE '" + tablename + "';", function (err, result, fields)
                    {
                        if (isNull(err))
                        {
                            if (result.length > 0)
                            {
                                Logger.log_boot_message("Interactions table " + tablename + " exists in the MySQL database.");
                                poolOK(pool);
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

                                Logger.log_boot_message("Interactions table " + tablename + " does not exist in the MySQL database. Running query for creating interactions table... \n" + createTableQuery);

                                connection.query(
                                    createTableQuery,
                                    function (err, result, fields)
                                    {
                                        if (isNull(err))
                                        {
                                            Logger.log_boot_message("Interactions table " + tablename + " succesfully created in the MySQL database.");

                                            connection.release();
                                            if (isNull(err))
                                            {
                                                Logger.log_boot_message("Indexes on table  " + tablename + " succesfully created in the MySQL database.");
                                                poolOK(pool);
                                            }
                                            else
                                            {
                                                return callback("[ERROR] Unable to create indexes on table  " + tablename + " in the MySQL database. Query was: \n" + createTableQuery + "\n . Result was: \n" + JSON.stringify(result, null, 4));
                                            }
                                        }
                                        else
                                        {
                                            return callback("[ERROR] Unable to create the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                                        }
                                    }
                                );
                            }
                        }
                        else
                        {
                            return callback("[ERROR] Unable to query for the interactions table " + tablename + " on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                        }
                    });
                };

                const tableForRecommendations = Config.recommendation.getTargetTable();

                checkAndCreateTable(tableForRecommendations, function (err, results)
                {
                    if (err)
                    {
                        return callback("Unable to create table " + tableForRecommendations + " in MySQL ");
                    }

                    poolOK(connection);
                });
            }
            else
            {
                callback(err, connection);
            }
        };

        const handleDisconnect = function (callback)
        {
            pool = mysql.createPool({
                host: Config.mySQLHost,
                user: Config.mySQLAuth.user,
                password: Config.mySQLAuth.password,
                database: Config.mySQLDBName,
                multipleStatements: true
            });

            pool.getConnection(function (err, connection)
            {
                if (err)
                {
                    console.log("error when connecting to db:", err);
                    setTimeout(function ()
                    {
                        handleDisconnect(callback);
                    }, 2000);
                }
                else
                {
                    connection.on("error", function (err)
                    {
                        console.log("db error", err);
                        if (err.code === "PROTOCOL_CONNECTION_LOST")
                        {
                            handleDisconnect(function (err, result)
                            {
                                callback(err, result);
                            });
                        }
                        else
                        {
                            return callback("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                        }
                    });

                    callback(err, connection);
                }
            });
        };

        handleDisconnect(executeCode);
    });
};

module.exports.initMySQL = initMySQL;
