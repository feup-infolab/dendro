const async = require('async');
const fs = require('fs');

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const destroyAllGraphs = function(app, callback)
{
    if(Config.startup.load_databases && Config.startup.destroy_all_graphs_on_startup)
    {
        if(Config.debug.database.destroy_all_graphs_on_startup)
        {
            const graphs = Object.keys(GLOBAL.db);
            const conn = GLOBAL.db.default.connection;

            async.map(graphs, function(graph, cb){

                const graphUri = GLOBAL.db[graph].graphUri;
                conn.deleteGraph(graphUri, function(err){
                    if(err)
                    {
                        return callback(err);
                    }
                    else
                    {
                        conn.graphExists(graphUri, function(err, exists){
                            if(exists)
                            {
                                console.error("Tried to delete graph " + graphUri + " but it still exists!");
                                process.exit(1);
                            }
                            else
                            {
                                cb(null, exists);
                            }
                        });
                    }
                });
            }, function(err, res)
            {
                return callback(err);
            });
        }
        else
        {
            return callback(null);
        }
    }
    else
    {
        callback(null);
    }
}

module.exports.destroyAllGraphs = destroyAllGraphs;