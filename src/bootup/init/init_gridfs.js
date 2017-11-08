const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;

const initGridFS = function (app, callback)
{
    Logger.log_boot_message("info", "Connecting to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
    const gfs = new GridFSConnection(
        Config.mongoDBHost,
        Config.mongoDbPort,
        Config.mongoDbCollectionName,
        Config.mongoDBAuth.user,
        Config.mongoDBAuth.password
    );

    gfs.open(function (err, gfsConn)
    {
        if (err)
        {
            return callback("[ERROR] Unable to connect to MongoDB file storage cluster running on " + Config.mongoDBHost + ":" + Config.mongoDbPort + "\n Error description : " + gfsConn);
        }
        Logger.log_boot_message("ok", "Connected to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
        Config.gfs.default.connection = gfs;
        return callback(null);
    });
};

module.exports.initGridFS = initGridFS;
