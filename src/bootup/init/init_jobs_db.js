const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const MongoClient = require("mongodb").MongoClient;

const initJobsDb = function (app, callback)
{
    /*
    Logger.log_boot_message("Connecting to MongoDB Jobs storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
    const url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + Config.mongoJobCollectionName;

    MongoClient.connect(url, function (err, db)
    {
        if (err)
        {
            return callback("[ERROR] Connecting to MongoDB Jobs storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort + "\n Error description : " + JSON.stringify(db));
        }
        Logger.log_boot_message("Connected to MongoDB Jobs storage running on " + Config.mongoDBHost + ":" + Config.mongoDbPort);
        Config.jobsStorageClient = db;
        return callback(null);
    });
    */
    callback(null);
};

module.exports.initJobsDb = initJobsDb;
