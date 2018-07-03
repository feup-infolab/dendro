const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;
const DendroMySQLClient = rlequire("dendro", "src/kb/mysql.js").DendroMySQLClient;

const initMySQL = function (app, callback)
{
    Logger.log("Setting up MySQL connection pool at host " + Config.mySQLHost + ":" + Config.mySQLPort);

    const client = new DendroMySQLClient(
        Config.mySQLHost,
        Config.mySQLPort,
        Config.mySQLDBName,
        Config.mySQLAuth.user,
        Config.mySQLAuth.password
    );

    // TODO This is commented until the merge with the new structure using migrations.
    return callback(null);

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
