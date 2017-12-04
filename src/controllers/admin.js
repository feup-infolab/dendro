const path = require("path");
const _ = require("underscore");
const async = require("async");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

module.exports.home = function (req, res)
{
    res.render("admin/home",
        {
            db: Config.db,
            title: "List of available administration operations"
        }
    );
};

// module.exports.reload = function (req, res)
// {
//     const graphNames = req.query.graphs;
//     const graphsToDelete = req.query.graphs_to_delete;
//     const async = require("async");
//
//     const renderResponse = function (err, messages)
//     {
//         if (isNull(err))
//         {
//             const util = require("util");
//             // noinspection ES6ConvertVarToLetConst
//             let messages = "All resources successfully loaded in graph(s) : ";
//
//             for (let i = 0; i < graphNames.length; i++)
//             {
//                 messages = messages + " " + graphNames[i];
//
//                 if (i < graphNames.length - 1)
//                 {
//                     messages = messages + ", ";
//                 }
//             }
//
//             res.render("admin/home",
//                 {
//                     title: "List of available administration operations",
//                     info_messages: [messages]
//                 }
//             );
//         }
//         else
//         {
//             res.render("admin/home",
//                 {
//                     title: "List of available administration operations",
//                     error_messages: messages
//                 }
//             );
//         }
//     };
//
//     const deleteGraph = function (graphUri, callback)
//     {
//         db.deleteGraph(graphUri, callback);
//     };
//
//     for (let graph in graphNames)
//     {
//     /* if(graphNames[i] === "dbpedia")
//         {
//             if(graphsToDelete[i])
//             {
//                 async.waterfall(
//                     [
//                         function(callback)
//                         {
//                             deleteGraph("http://dbpedia.org",
//                                 function(err, resultOrErrorMessage)
//                                 {
//                                     return callback(err, [resultOrErrorMessage]);
//                                 });
//                         },
//                         function(callback, result)
//                         {
//                             var path = require('path');
//                             var DBPediaLoader = require("../kb/loaders/dbpedia/loader").DBPediaLoader;
//                             var dbpediaLoader = new DBPediaLoader(db);
//                             dbpediaLoader.load_dbpedia(renderResponse);
//                         }
//                     ],
//                     renderResponse
//                 );
//             }
//             else
//             {
//                 var path = require('path');
//                 var DBPediaLoader = require("../kb/loaders/dbpedia/loader").DBPediaLoader;
//                 var dbpediaLoader = new DBPediaLoader(db);
//                 dbpediaLoader.load_dbpedia(renderResponse);
//             }
//         } */
//         if (graph === "dryad")
//         {
//             const dryadLoader = new DryadLoader();
//             dryadLoader.loadFromDownloadedFiles(req.index);
//         }
//     }
//
//     res.render("admin/home",
//         {
//             title: "List of available administration operations",
//             info_messages: [JSON.stringify(graphNames) + " loading in the background"]
//         }
//     );
// };

module.exports.reindex = function (req, res)
{
    const indexConnection = req.index;
    const graphsToBeIndexed = req.body.graphs_to_reindex;
    const graphsToDelete = req.body.graphs_to_delete;

    const rebuildIndex = function (indexConnection, graphShortName, deleteBeforeReindexing, callback)
    {
        if (!isNull(IndexConnection.indexes[graphShortName]))
        {
            async.waterfall([
                // delete current index if requested
                function (callback)
                {
                    indexConnection.create_new_index(1, 1, deleteBeforeReindexing, function (err, result)
                    {
                        if (isNull(err) && isNull(result))
                        {
                            Logger.log("Index " + indexConnection.index.short_name + " recreated .");
                            return callback(null);
                        }

                        Logger.log("Error recreating index " + indexConnection.index.short_name + " . " + result);
                        // delete success, move on
                        return callback(1);
                    });
                },
                // select all elements in the knowledge base
                function (callback)
                {
                    let failed;
                    Resource.for_all(
                        function (err, resources)
                        {
                            if (isNull(err))
                            {
                                if (resources.length > 0)
                                {
                                    async.map(resources, function (resource, callback)
                                    {
                                        Logger.log("Resource " + resource.uri + " now being reindexed.");

                                        resource.reindex(indexConnection, function (err, results)
                                        {
                                            if (err)
                                            {
                                                Logger.log("error", "Error indexing Resource " + resource.uri + " : " + results);
                                                failed = true;
                                            }

                                            callback(failed, results);
                                        });
                                    }, function (err, results)
                                    {
                                        if (err)
                                        {
                                            Logger.log("error", "Errors occurred indexing all Resources : " + results);
                                            failed = true;
                                        }

                                        return callback(failed, null);
                                    });
                                }
                                else
                                {
                                    return callback(failed, null);
                                }
                            }
                            else
                            {
                                failed = true;
                                return callback(failed, "Error fetching all resources in the graph : " + resources);
                            }
                        },
                        function ()
                        {
                            return failed;
                        },
                        function (err)
                        {
                            return callback(null, null);
                        });
                }
            ],
            function (err, results)
            {
                if (isNull(err))
                {
                    return callback(null, results);
                }
                return callback(1, results);
            });
        }
        else
        {
            return callback(1, "Non-existent index : " + graphShortName);
        }
    };

    async.mapSeries(
        graphsToBeIndexed,
        function (graph, cb)
        {
            const deleteTheIndex = Boolean(_.contains(graphsToDelete, graph));

            rebuildIndex(indexConnection, graph, deleteTheIndex, function (err, result)
            {
                cb(err, result);
            });
        }, function (err, result)
        {
            if (err)
            {
                res.render("admin/home",
                    {
                        title: "List of available administration operations",
                        error_messages: [result],
                        db: Config.db
                    }
                );
            }
            else
            {
                res.render("admin/home",
                    {
                        title: "List of available administration operations",
                        info_messages: ["Resources successfully indexed for graphs " + JSON.stringify(graphsToBeIndexed)],
                        db: Config.db
                    }
                );
            }
        });
};
