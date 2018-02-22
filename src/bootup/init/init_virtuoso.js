const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
let DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;

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
