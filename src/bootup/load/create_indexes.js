const async = require("async");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

const createIndexes = function (app, callback)
{
    Logger.log_boot_message("Now trying to connect to ElasticSearch Cluster to check if the required indexes exist or need to be created...");

    async.series([
        function (callback)
        {
            if (Config.startup.load_databases && Config.startup.destroy_all_indexes)
            {
                IndexConnection.destroyAllIndexes(function (error, result)
                {
                    if (!isNull(error))
                    {
                        callback("[ERROR] Unable to delete all indexes on startup!");
                    }
                    else
                    {
                        Logger.log_boot_message("Deleted all indexes on startup!");
                        callback(null);
                    }
                });
            }
            else
            {
                callback(null);
            }
        },
        function (callback)
        {
            IndexConnection.createAllIndexes(function (error, result)
            {
                if (!isNull(error))
                {
                    callback("[ERROR] Unable to create all indexes on startup!");
                }
                else
                {
                    Logger.log_boot_message("Indexes are up and running!");
                    callback(null);
                }
            });
        }
    ], callback);
};

module.exports.createIndexes = createIndexes;
