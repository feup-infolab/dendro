const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DendroMySQLClient = require(Pathfinder.absPathInSrcFolder("/kb/mysql.js")).DendroMySQLClient;

const initMySQL = function (app, callback)
{
    Logger.log("Setting up MySQL connection pool.");

    const client = new DendroMySQLClient(
        Config.mySQLHost,
        Config.mySQLPort,
        Config.mySQLDBName,
        Config.mySQLAuth.user,
        Config.mySQLAuth.password
    );

    client.createDatabaseIfNotExists(function (err, result)
    {
        if (isNull(err))
        {
            client.checkAndCreateInteractionsTable(Config.recommendation.getTargetTable(), function (err, results)
            {
                if (err)
                {
                    callback("Unable to create interactions table " + Config.recommendation.getTargetTable() + " in MySQL ");
                }
                else
                {
                    if (Config.getMySQLByID().connection)
                    {
                        Config.getMySQLByID().connection.releaseAllConnections(function ()
                        {
                            Config.getMySQLByID().connection = client;
                            Logger.log("ReConnected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
                            return callback(null);
                        });
                    }
                    else
                    {
                        Config.getMySQLByID().connection = client;
                        Logger.log("Connected to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort);
                        return callback(null);
                    }
                }
            });
        }
        else
        {
            callback(err, result);
        }
    });
};

module.exports.initMySQL = initMySQL;
