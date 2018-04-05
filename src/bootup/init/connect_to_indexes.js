const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const connectToIndexes = function (app, callback)
{
    Logger.log_boot_message("Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");

    IndexConnection.createAllIndexes(false, function (error, result)
    {
        if (!isNull(error))
        {
            callback("[ERROR] Unable to create or link to index " + IndexConnection._all.dendro_graph.short_name);
        }
        else
        {
            Logger.log_boot_message("Indexes are up and running on " + Config.elasticSearchHost + ":" + Config.elasticSearchPort);
            callback(null);
        }
    });
};

module.exports.connectToIndexes = connectToIndexes;
