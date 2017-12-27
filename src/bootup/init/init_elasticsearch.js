const async = require("async");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
let IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;

const initElasticSearch = function (app, callback)
{
    Logger.log_boot_message("Connecting to ElasticSearch Cluster...");

    IndexConnection.initAllIndexes(function (err, results)
    {
        if (isNull(err))
        {
            Logger.log_boot_message("Created connections to ElasticSearch Clusters but did not try to connect yet...");
            return callback(null);
        }

        const msg = "[ERROR] Unable to create connection to indexes!";
        Logger.log("error", msg);
        return callback(msg);
    });
};

module.exports.initElasticSearch = initElasticSearch;
