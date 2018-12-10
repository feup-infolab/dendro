const fs = require("fs");
const _ = require("underscore");
const async = require("async");

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const repository_platform_configs_file_path = rlequire.absPathInApp("dendro", "conf/repository_platform_configs.json");
const active_config_file_path = rlequire.absPathInApp("dendro", "conf/active_deployment_config.json");

const Sequelize = require("sequelize");
const Umzug = require("umzug");

const buildMySQLDatabase = function (app, callback)
{
    const tryToCreateDatabaseIfNeeded = function (callback)
    {
        // Create connection omitting database name, create database if not exists
        const sequelize = new Sequelize("", Config.mySQLAuth.user, Config.mySQLAuth.password, {
            dialect: "mysql",
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

                const destroyDatabase = function ()
                {
                    let dropQuery = "DROP DATABASE IF EXISTS " + Config.mySQLDBName + "; ";
                    return sequelize.query(dropQuery)
                        .catch(err =>
                        {
                            Logger.log("error", "Error destroying database in MySQL: " + Config.mySQLDBName);
                            Logger.log("error", JSON.stringify(err));
                            throw err;
                        });
                };

                const createDatabase = function ()
                {
                    return sequelize.query(`CREATE DATABASE IF NOT EXISTS ${Config.mySQLDBName};`)
                        .then(result =>
                            sequelize.query(`GRANT ALL PRIVILEGES ON ${Config.mySQLDBName}.* TO '${Config.mySQLAuth.user}'@'%'; `)
                                .then(result =>
                                    sequelize.query(`FLUSH PRIVILEGES;`)
                                        .catch(err =>
                                        {
                                            Logger.log("error", "Error flushing privileges in MySQL");
                                            Logger.log("error", JSON.stringify(err));
                                            throw err;
                                        }))
                                .catch(err =>
                                {
                                    Logger.log("error", `Error granting all privileges on database ${Config.mySQLDBName} in MySQL.`);
                                    Logger.log("error", JSON.stringify(err));
                                    throw err;
                                }))
                        .catch(err =>
                        {
                            Logger.log("error", "Error creating database in MySQL: " + Config.mySQLDBName);
                            Logger.log("error", JSON.stringify(err));
                            throw err;
                        });
                };

                if (Config.startup.load_databases && Config.startup.destroy_mysql_database)
                {
                    return destroyDatabase()
                        .then(data =>
                        {
                            createDatabase()
                                .then(data =>
                                    callback(null, data));
                        });
                }

                return createDatabase()
                    .then(data =>
                        callback(null, data));
            })
            .catch(err =>
            {
                Logger.log("error", "Error authenticating in MySQL database : " + Config.mySQLDBName);
                Logger.log("error", JSON.stringify(err));
                return callback(err, null);
            });
    };

    tryToCreateDatabaseIfNeeded(function (err, result)
    {
        if (isNull(err))
        {
            // run migrations
            const sequelize = new Sequelize(Config.mySQLDBName, Config.mySQLAuth.user, Config.mySQLAuth.password, {
                dialect: "mysql",
                host: Config.mySQLHost,
                port: Config.mySQLPort,
                logging: false,
                define: {
                    underscored: false,
                    freezeTableName: true,
                    charset: "utf8"
                },
                operatorsAliases: false
            });

            var umzug = new Umzug({
                storage: "sequelize",
                storageOptions: { sequelize: sequelize },
                migrations: {
                    params: [sequelize.getQueryInterface(), Sequelize],
                    path: rlequire.absPathInApp("dendro", "src/mysql_migrations")
                }
            });

            return umzug.up().then(function ()
            {
                return callback(null);
            }).catch(err =>
            {
                console.log(err);
                return callback(err);
            });
        }
        else
        {
            Logger.log("error", "Error occurred when running MySQL migrations on startup.");
            Logger.log("error", err);
            Logger.log("error", result);
            callback(err);
        }
    });
};

module.exports.buildMySQLDatabase = buildMySQLDatabase;
