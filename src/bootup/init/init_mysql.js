/*const fs = require("fs");
const needle = require("needle");*/

const Sequelize = require('sequelize');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const initMySQL = function (app, callback)
{
    Logger.log_boot_message("Setting up MySQL connection pool.");

    //const mysql = require("mysql2");
    const createDatabase = function (callback)
    {
        // Create connection omitting database name, create database if not exists
        const sequelize = new Sequelize("", Config.mySQLAuth.user, Config.mySQLAuth.password, {
            dialect: 'mysql',
            host: Config.mySQLHost,
            port: Config.mySQLPort,
            logging: false,
            operatorsAliases: false
        });
        sequelize
            .authenticate()
            .then(() =>
            {
                Logger.log_boot_message("Connected to MySQL!");
                return sequelize.query("CREATE DATABASE IF NOT EXISTS " + Config.mySQLDBName + ";").then(data =>
                {
                    return callback(null, data);
                })
                    .catch(err =>
                    {
                        Logger.log("error", "Error creating database in MySQL: " + Config.mySQLDBName);
                        return callback(err, null);
                    });
            })
            .catch(err =>
            {
                return callback(err, null);
            });

        /*let con = mysql.createConnection({
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
        );*/
    };

    createDatabase(function (err, result)
    {
        if (!isNull(err))
        {
            return callback(err, result);
        }

        const sequelize = new Sequelize(Config.mySQLDBName, Config.mySQLAuth.user, Config.mySQLAuth.password, {
            dialect: 'mysql',
            host: Config.mySQLHost,
            port: Config.mySQLPort,
            logging: false,
            define: {
                underscored: false,
                freezeTableName: true,
                charset: 'utf8',
            },
            operatorsAliases: false
        });

        const tableName = Config.recommendation.getTargetTable();
        sequelize.interactions = require('../mysql_models/interactions')(Sequelize, sequelize, tableName);
        sequelize.events = require('../mysql_models/events')(Sequelize, sequelize);
        sequelize.type = require('../mysql_models/type')(Sequelize, sequelize);
        sequelize.events.belongsTo(sequelize.type);

        sequelize.sync().then(() => {
            Logger.log_boot_message("MySQL tables defined.");
            Config.mysql.default.sequelize = sequelize;
            return sequelize.type.findAll().then(res => {
                if (res.length == 0) {
                    return sequelize.type.bulkCreate([
                        { name: 'like' },
                        { name: 'comment' },
                        { name: 'share'},
                        { name: 'post'},
                    ]);
                }
                return callback(null);
            }).catch(err => {
                return callback(err);
            });
        }).catch(err => {
            return callback("[ERROR] Unable to create the tables on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
        });


        /*const pool = mysql.createPool({
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
                return callback("[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
            }
        });*/
    });
};

module.exports.initMySQL = initMySQL;
