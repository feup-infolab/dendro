const rlequire = require("rlequire");
const async = require("async");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Sequelize = require("sequelize");
const Umzug = require("umzug");

const initMySQL = function (app, callback)
{
    Logger.log_boot_message("Setting up MySQL connection pool.");

    const createDatabase = function (callback)
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
                return sequelize.query("CREATE DATABASE IF NOT EXISTS " + Config.mySQLDBName + ";").then(data =>
                    callback(null, data))
                    .catch(err =>
                    {
                        Logger.log("error", "Error creating database in MySQL: " + Config.mySQLDBName);
                        return callback(err, null);
                   });
            })
            .catch(err =>
            {
              Logger.log("error", "Error authenticating in MySQL database : " + Config.mySQLDBName);
              Logger.log("error", "Error authenticating in MySQL database : " + Config.mySQLDBName);
              return callback(err, null);
            });
    };

    async.retry({
        times: 240,
        interval: function (retryCount)
        {
            const msecs = 500;
            Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to determine ElasticSearch cluster health");
            return msecs;
        }
    }, createDatabase, function (err)
    {
        if (!isNull(err))
        {
            return callback(err);
        }

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
    });
};

module.exports.initMySQL = initMySQL;
