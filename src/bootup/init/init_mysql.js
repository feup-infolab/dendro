const Sequelize = require("sequelize");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Umzug = require("umzug");
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

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
                callback(err, null));
    };

    createDatabase(function (err, result)
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
                path: Pathfinder.absPathInSrcFolder("/mysql_migrations")}
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
