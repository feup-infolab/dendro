const async = require("async");
const rlequire = require("rlequire");
const mysql = require("mysql2");
const fs = require("fs");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

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

    Logger.log("info", "process.env.NODE_ENV is: " + process.env.NODE_ENV);
    Logger.log("info", "Config.startup.load_databases is: " + Config.startup.load_databases);
    Logger.log("info", "Config.startup.destroy_mysql_database is: " + Config.startup.destroy_mysql_database);
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
