const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;

const initElasticSearch = function (app, callback)
{
    Logger.log_boot_message("Connecting to ElasticSearch Cluster...");
    const index = new IndexConnection();

    index.open(Config.elasticSearchHost, Config.elasticSearchPort, IndexConnection.indexes.dendro_graph, function (index)
    {
        if (index.client)
        {
            Logger.log_boot_message("Created connection to ElasticSearch Cluster on " + Config.elasticSearchHost + ":" + Config.elasticSearchPort + " but did not try to connect yet");
        }
        else
        {
            return callback("[ERROR] Unable to create connection to index " + IndexConnection.indexes.dendro_graph.short_name, app, index);
        }
        return callback(null, app, index);
    });
};

module.exports.initElasticSearch = initElasticSearch;
