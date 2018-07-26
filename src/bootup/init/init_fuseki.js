const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const FusekiConnection = rlequire("dendro", "src/kb/db-adapters/fuseki.js").FusekiConnection;

const initFuseki = function (app, callback)
{
    if (Config.graphDatabase === "fuseki")
    {
        Logger.log_boot_message("Initializing Fuseki Connection...");

        // maxSimultaneousConnections is 1 because Virtuoso cant handle more than one connection properly. Only ONE connection and not more!!
        let db = new FusekiConnection(
            {
                handle: Config.db.default.graphHandle,
                host: Config.fusekiHost,
                port: Config.fusekiPort,
                username: Config.fusekiAuth.user,
                password: Config.fusekiAuth.password,
                maxSimultaneousConnections: 1,
                dbOperationsTimeout: Config.dbOperationTimeout,
                dataset: Config.fusekiDataset,
                dbType: Config.fusekiDbType,
                ontologyGraphs: Config.enabledOntologies
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
                const msg = "[FATAL ERROR] Fuseki initialization at " + Config.fusekiHost + ":" + Config.fusekiPort + " failed!";
                Logger.log("error", msg);
                Logger.log("error", err);
                throw new Error(msg);
            }
        });
    }
    else
    {
        callback(null);
    }
};

module.exports.initFuseki = initFuseki;
