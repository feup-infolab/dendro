const async = require("async");
const fs = require("fs");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const mysql = require("mysql2");

const destroyMySQLDatabase = function (app, callback)
{
    const destroyDatabase = function (cb)
    {
        var con = mysql.createConnection({
            host: Config.mySQLHost,
            user: Config.mySQLAuth.user,
            password: Config.mySQLAuth.password
        });
        con.query("DROP DATABASE IF EXISTS " + Config.mySQLDBName + ";\n", function (err, result)
        {
            if (!isNull(err))
            {
                Logger.log("error", "Error dropping database in MySQL: " + Config.mySQLDBName);
            }
            con.destroy();
            cb(err, result);
        });
    };

    if (process.env.NODE_ENV === "test" && !isNull(Config.startup.load_databases) && Config.startup.load_databases && !isNull(Config.startup.destroy_mysql_database) && Config.startup.destroy_mysql_database)
    {
        Logger.log("info", "Will destroy the MySQL database!!");
        destroyDatabase(function (err, info)
        {
            if (isNull(err))
            {
                Logger.log("info", "MySQL database: " + Config.mySQLDBName + " destroyed successfully!!");
                callback(err);
            }
            else
            {
                Logger.log("error", "Could not destroy MySQL database: " + Config.mySQLDBName + ", error: " + JSON.stringify(info));
                callback(err);
            }
        });
    }
    else
    {
        Logger.log("info", "Will not destroy the MySQL database!!");
        callback(null);
    }
};

module.exports.destroyMySQLDatabase = destroyMySQLDatabase;
