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
        Config.virtuosoHost,
        Config.virtuosoPort,
        Config.virtuosoISQLPort,
        Config.virtuosoAuth.user,
        Config.virtuosoAuth.password,
        Config.maxSimultaneousConnectionsToDb,
        // 1, // it is one because Virtuoso cant handle more than one connection properly. Only ONE connection and not more!!
        Config.dbOperationTimeout
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
