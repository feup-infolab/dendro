const fs = require("fs");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let GridFSConnection = rlequire("dendro", "src/kb/gridfs.js").GridFSConnection;

const initGridFS = function (app, callback)
{
    Logger.log_boot_message("Connecting to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
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
        Logger.log_boot_message("Connected to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
        Config.gfs.default.connection = gfs;
        return callback(null);
    });
};

module.exports.initGridFS = initGridFS;
