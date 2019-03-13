const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
let DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;

const initVirtuoso = function (app, callback)
{
    Logger.log_boot_message("Initializing Virtuoso Connection...");

    let db = new DbConnection(
        Config.db.default.graphHandle,
        Config.virtuoso.host,
        Config.virtuoso.port,
        Config.virtuoso.iSQLPort,
        Config.virtuoso.auth.user,
        Config.virtuoso.auth.password,
        Config.virtuoso.maxSimultaneousConnectionsToDb,
        // 1, // it is one because Virtuoso cant handle more than one connection properly. Only ONE connection and not more!!
        Config.virtuoso.dbOperationTimeout,
        Config.virtuoso.forceClientDisconnectOnConnectionClose,
        Config.virtuoso.forceShutdownOnConnectionClose
    );

    db.tryToConnect(function (err)
    {
        if (isNull(err))
        {
            Config.db.default.connection = db;
            callback(err);
        }
        else
        {
            const msg = "[FATAL ERROR] Virtuoso initialization at " + Config.virtuosoHost + ":" + Config.virtuosoPort + " failed!";
            Logger.log("error", msg);
            Logger.log("error", err);
            throw new Error(msg);
        }
    });
};

module.exports.initVirtuoso = initVirtuoso;
