const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;

const initVirtuoso = function(app, callback)
{
    let db = new DbConnection(
        Config.virtuosoHost,
        Config.virtuosoPort,
        Config.virtuosoAuth.user,
        Config.virtuosoAuth.password,
        Config.maxSimultaneousConnectionsToDb);

    db.create(function(db) {
        if(!db)
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
    });
}

module.exports.initVirtuoso = initVirtuoso;