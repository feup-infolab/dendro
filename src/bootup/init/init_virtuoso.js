const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
let DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;

const initVirtuoso = function(app, callback)
{
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

    db.create(function(err, db) {
        if(isNull(err))
        {
            if(isNull(db))
            {
                return callback("[ERROR] Unable to connect to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);
            }
            else
            {
                Logger.log_boot_message("success", "Connected to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);

                //set default connection. If you want to add other connections, add them in succession.
                Config.db.default.connection = db;

                return callback(null);
            }
        }
        else
        {
            callback("[ERROR] Error connecting to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);
            console.error(JSON.stringify(err));
            console.error(JSON.stringify(db));
        }

    });
}

module.exports.initVirtuoso = initVirtuoso;
