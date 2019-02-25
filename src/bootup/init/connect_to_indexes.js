const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

const connectToIndexes = function (app, callback)
{
    Logger.log_boot_message("Now trying to connect to Indexing engine " + Config.index.type + " to check if the required indexes exist or need to be created...");

    IndexConnection.createAllIndexes(function (error, result)
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
    }, (Config.startup.load_databases && Config.startup.destroy_all_indexes));
};

module.exports.connectToIndexes = connectToIndexes;
