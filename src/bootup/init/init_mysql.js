const rlequire = require("rlequire");
const async = require("async");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Sequelize = require("sequelize");

const initMySQL = function (app, callback)
{
    Logger.log_boot_message("Setting up MySQL connection pool.");

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
                return callback(null);
            })
            .catch(err =>
            {
                Logger.log("error", "Error authenticating in MySQL database : " + Config.mySQLDBName);
                Logger.log("error", JSON.stringify(err));
                return callback(err, null);
            });
    };

    async.retry({
        times: 240,
        interval: function (retryCount)
        {
            const msecs = 500;
            Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to determine if MySQL is running...");
            return msecs;
        }
    }, tryToCreateDatabaseIfNeeded, function (err)
    {
        if (!isNull(err))
        {
            Logger.log("error", "Unable to connect to mysql server at " + Config.mySQLHost + ":" + Config.mySQLPort);
            Logger.log("error", err.message);
        }
        else
        {
            Logger.log("info", "Successfully connected to mysql server at " + Config.mySQLHost + ":" + Config.mySQLPort);
        }

        return callback(err);
    });
};

module.exports.initMySQL = initMySQL;
