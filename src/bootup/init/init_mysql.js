const fs = require("fs");
const needle = require("needle");
const async = require("async");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const initMySQL = function (app, callback)
{
    Logger.log_boot_message("Setting up MySQL connection pool.");
    const mysql = require("mysql");
    
    const createStoredProcedures = function (pool, callback) {
        const createGetProjectFavoriteDescriptorsProcedure = function (cb) {
            const mysql = Config.getMySQLByID();
            const dbName = Config.mySQLDBName;
            const targetTable = Config.recommendation.getTargetTable();
            const interactionsTable = dbName + "."+ targetTable;
            const procedureName = "getProjectFavoriteDescriptors";
            const queryString = "DROP PROCEDURE IF EXISTS " + procedureName + "; \n" +
                "CREATE PROCEDURE " + procedureName + "(IN projectUri VARCHAR(255))" + " \n" +
                "BEGIN \n" +
                "SELECT DISTINCT favoritesInfo.executedOver, favoritesInfo.created, favoritesInfo.interactionType FROM " + interactionsTable + " AS favoritesInfo \n" +
                "JOIN " + interactionsTable + " AS unfavoritesInfo \n" +
                "ON favoritesInfo.interactionType in \n" +
                "('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
                "AND favoritesInfo.projectUri = projectUri AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
                "AND unfavoritesInfo.projectUri = projectUri AND unfavoritesInfo.projectUri = favoritesInfo.projectUri AND favoritesInfo.executedOver = unfavoritesInfo.executedOver \n" +
                "WHERE \n" +
                "(favoritesInfo.created = (SELECT MAX(created) FROM " + interactionsTable + " WHERE projectUri = projectUri AND " + interactionsTable +".interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND " + interactionsTable + ".executedOver = favoritesInfo.executedOver)) \n" +
                "OR (favoritesInfo.created = (SELECT MAX(created) FROM " + interactionsTable + " WHERE projectUri = projectUri AND " + interactionsTable + ".interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType = 'unfavorite_descriptor_from_quick_list_for_project' AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND " + interactionsTable + ".executedOver = favoritesInfo.executedOver AND  unfavoritesInfo.created < favoritesInfo.created)); \n" +
                "END";

            pool.getConnection(function (err, connection)
            {
                if (isNull(err))
                {
                    connection.query(queryString, function (err, rows, fields)
                    {
                        connection.release();
                        if (isNull(err))
                        {
                            Logger.log("info", "Stored procedure: " + procedureName + " created");
                            return cb(null, rows);
                        }
                        else
                        {
                            const errorMsg = "Error creating " + procedureName + " stored procedure in the MySQL database, error; " + JSON.stringify(err);
                            Logger.log("error", errorMsg);
                            return cb(true, errorMsg);
                        }
                    });
                }
                else
                {
                    const msg = "Unable to get MYSQL connection when looking for project: " + self.uri  + " favorite descriptors";
                    Logger.log("error", msg);
                    Logger.log("error", err.stack);
                    return cb(1, msg);
                }
            });
        };

        const createGetProjectHiddenDescriptorsProcedure = function (cb) {
            cb(null);
        };

        const createGetUserFavoriteDescriptorsProcedure = function (cb) {
            cb(null);
        };

        const createGetUserHiddenDescriptorsProcedure = function (cb) {
            cb(null);
        };

        async.waterfall([
            function (cb)
            {
                createGetProjectFavoriteDescriptorsProcedure(function (err, info)
                {
                    if(!isNull(err))
                    {
                        Logger.log("error", JSON.stringify(info));
                    }
                    cb(err);
                });
            },
            function (cb)
            {
                createGetProjectHiddenDescriptorsProcedure(function (err, info) {
                    if(!isNull(err))
                    {
                        Logger.log("error", JSON.stringify(info));
                    }
                    cb(err);
                })
            },
            function (cb)
            {
                createGetUserFavoriteDescriptorsProcedure(function (err, info) {
                    if(!isNull(err))
                    {
                        Logger.log("error", JSON.stringify(info));
                    }
                    cb(err);
                });
            },
            function (cb) {
                createGetUserHiddenDescriptorsProcedure(function (err, info) {
                    if(!isNull(err))
                    {
                        Logger.log("error", JSON.stringify(info));
                    }
                    cb(err);
                });
            }
        ], function (err, results)
        {
            callback(err, results);
        });
    };

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
        if (!isNull(err))
        {
            callback(err, result);
        }

        const pool = mysql.createPool({
            host: Config.mySQLHost,
            user: Config.mySQLAuth.user,
            password: Config.mySQLAuth.password,
            database: Config.mySQLDBName,
            multipleStatements: true
        });

        const poolOK = function (pool)
        {
            Logger.log_boot_message("Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
            Config.mysql.default.pool = pool;
            return callback(null);
        };

        pool.getConnection(function (err, connection)
        {
            // const freeConnectionsIndex = pool._freeConnections.indexOf(connection);

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
                                createStoredProcedures(pool, function (err, info) {
                                    if(isNull(err))
                                    {
                                        poolOK(pool);
                                    }
                                    else
                                    {
                                        let errorMessage = "Unable to create stored procedures in MySQL, error: " + JSON.stringify(err);
                                        Logger.log("error", errorMessage);
                                        return callback(errorMessage);
                                    }
                                });
                                //old code bellow
                                //poolOK(pool);
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
                                    "   `projectUri` text DEFAULT NULL, \n" +
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
                                    "CREATE INDEX " + tablename + "_projectUri_text ON " + tablename + "(projectUri(255)); \n" +
                                    "CREATE INDEX " + tablename + "_pUri_intType_execOver_text ON " + tablename + "(projectUri(255), interactionType(255), executedOver(255)); \n" +
                                    "CREATE INDEX " + tablename + "_perfBy_intType_execOver_text ON " + tablename + "(performedBy(255), interactionType(255), executedOver(255)); \n" +
                                    "CREATE INDEX " + tablename + "_created_text ON " + tablename + "(created); \n" +
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
                                                createStoredProcedures(pool, function (err, info) {
                                                    if(isNull(err))
                                                    {
                                                        poolOK(pool);
                                                    }
                                                    else
                                                    {
                                                        let errorMessage = "Unable to create stored procedures in MySQL, error: " + JSON.stringify(err);
                                                        Logger.log("error", errorMessage);
                                                        return callback(errorMessage);
                                                    }
                                                });
                                                //old code bellow
                                                //poolOK(pool);
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
                return callback("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
            }
        });
    });
};

module.exports.initMySQL = initMySQL;
