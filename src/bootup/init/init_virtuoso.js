const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const VirtuosoConnection = rlequire("dendro", "src/kb/db-adapters/virtuoso.js").VirtuosoConnection;

const initVirtuoso = function (app, callback)
{
    Logger.log_boot_message("Initializing Virtuoso Connection...");

    // maxSimultaneousConnections is 1 because Virtuoso cant handle more than one connection properly. Only ONE connection and not more!!
    let db = new VirtuosoConnection(
        {
            handle: Config.db.default.graphHandle,
            host: Config.virtuosoHost,
            port: Config.virtuosoPort,
            portISQL: Config.virtuosoISQLPort,
            username: Config.virtuosoAuth.user,
            password: Config.virtuosoAuth.password,
            maxSimultaneousConnections: 1,
            dbOperationsTimeout: Config.dbOperationTimeout
        }
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
