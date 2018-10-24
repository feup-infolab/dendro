const async = require("async");
const rlequire = require("rlequire");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
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
        Config.mongoDBAuth.username,
        Config.mongoDBAuth.password
    );


    const attemptConnection = function (callback)
    {
        gfs.open(function (err, gfsConn)
        {
            if (err)
            {
                return callback(err, gfsConn);
            }
            else
            {
                return callback(null, gfsConn);
            }
        });
    }

    async.retry({
        times: 240,
        interval: function (retryCount)
        {
            const msecs = 500;
            Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to GridFS");
            return msecs;
        }
    }, attemptConnection, function (err, gfsConn)
    {
        if (isNull(err))
        {
            Logger.log_boot_message("Connected to MongoDB file storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
            Config.gfs.default.connection = gfs;
            callback(null);
        }
        else
        {
            callback("[ERROR] Unable to connect to MongoDB file storage cluster running on " + Config.mongoDBHost + ":" + Config.mongoDbPort + "\n Error description : " + gfsConn);
            Logger.log("error", );
            throw new Error(msg);
        }
    });
};

module.exports.initGridFS = initGridFS;
