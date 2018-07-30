const async = require("async");
const fs = require("fs");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const destroyAllGraphs = function (app, callback)
{
    if (Config.startup.load_databases && Config.startup.destroy_all_graphs)
    {
        const graphs = Object.keys(Config.db);
        const conn = Config.db.default.connection;

        async.mapSeries(graphs, function (graph, cb)
        {
            const graphUri = Config.db[graph].graphUri;
            conn.deleteGraph(graphUri, function (err)
            {
                if (err)
                {
                    callback(err);
                }
                else
                {
                    conn.graphExists(graphUri, function (err, exists)
                    {
                        if (exists)
                        {
                            const msg = "Tried to delete graph " + graphUri + " but it still exists!";
                            Logger.log("error", msg);
                            cb(1, msg);
                        }
                        else
                        {
                            cb(null, exists);
                        }
                    });
                }
            });
        }, function (err, res)
        {
            return callback(err);
        });
    }
    else
    {
        callback(null);
    }
};

module.exports.destroyAllGraphs = destroyAllGraphs;
