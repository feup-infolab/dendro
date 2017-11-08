const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const createIndexes = function (app, index, callback)
{
    Logger.log_boot_message("info", "Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");

    index.create_new_index(1, 1, Config.startup.destroy_indexes, function (error, result)
    {
        if (!isNull(error))
        {
            return callback("[ERROR] Unable to create or link to index " + IndexConnection.indexes.dendro.short_name);
        }
        Logger.log_boot_message("ok", "Indexes are up and running on " + Config.elasticSearchHost + ":" + Config.elasticSearchPort);
        return callback(null);
    });
};

module.exports.createIndexes = createIndexes;
