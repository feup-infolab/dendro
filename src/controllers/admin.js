const path = require("path");
const slug = require("slug");
const mkdirp = require("mkdirp");
const pm2 = require("pm2");
const _ = require("underscore");
const async = require("async");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const fs = require("fs");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

let classesToReindex = [Folder, File, User, Project];

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
//             dryadLoader.loadFromDownloadedFiles(IndexConnection.get(IndexConnection._all.dendro_graph));
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
    const graphsToBeIndexed = req.body.graphs_to_reindex;
    const graphsToDelete = req.body.graphs_to_delete;

    const rebuildIndex = function (indexConnection, graphShortName, deleteBeforeReindexing, callback)
    {
        if (!isNull(IndexConnection.get(graphShortName)))
        {
            async.waterfall([
                // delete current index if requested
                function (callback)
                {
                    indexConnection.create_new_index(1, 1, deleteBeforeReindexing, function (err, result)
                    {
                        if (isNull(err) && isNull(result))
                        {
                            Logger.log("Index " + indexConnection.short_name + " recreated .");
                            return callback(null);
                        }

                        Logger.log("Error recreating index " + indexConnection.short_name + " . " + result);
                        // delete success, move on
                        return callback(1);
                    });
                },
                // select all elements in the knowledge base
                function (callback)
                {
                    let failed;

                    async.mapSeries(classesToReindex, function (classToReindex, cb)
                    {
                        classToReindex.for_all(
                            function (err, resources)
                            {
                                if (isNull(err))
                                {
                                    if (resources.length > 0)
                                    {
                                        async.mapSeries(resources, function (resource, callback)
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
                                return cb(err, null);
                            });
                    }, function (err, results)
                    {
                        callback(err, results);
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
            if (!isNull(IndexConnection.get(graph)))
            {
                const deleteTheIndex = Boolean(_.contains(graphsToDelete, graph));
                let indexConnection = IndexConnection.get(graph);

                if (!isNull(indexConnection))
                {
                    rebuildIndex(indexConnection, graph, deleteTheIndex, function (err, result)
                    {
                        return cb(err, result);
                    });
                }
                else
                {
                    return cb(2, "Index with key " + graph + " not found 2!");
                }
            }
            else
            {
                return cb(1, "Index with key " + graph + " not found!");
            }
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

module.exports.logs = function (req, res)
{
    let lines = 30;
    try
    {
        lines = parseInt(req.query.lines);
    }
    catch (e)
    {
        res.status(400).json({
            result: "error",
            message: "Invalid 'lines' parameter"
        });
    }

    const getLastLinesOfLogs = function (combinedLogPath, errorLogPath)
    {
        const readLastLines = require("read-last-lines");
        async.series([
            function (cb)
            {
                readLastLines.read(combinedLogPath, lines)
                    .then((lines) => cb(null, lines));
            },
            function (cb)
            {
                readLastLines.read(errorLogPath, lines)
                    .then((lines) => cb(null, lines));
            }
        ], function (err, results)
        {
            if (isNull(err))
            {
                res.json({
                    combined: results[0].split("\n").reverse().join("\n"),
                    error: results[1].split("\n").reverse().join("\n")
                });
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Error fetching logs! " + JSON.stringify(results),
                    error: err
                });
            }
        });
    };

    if (process.env.NODE_ENV === "production")
    {
        pm2.connect(function (err)
        {
            if (err)
            {
                console.error(err);
                process.exit(2);
            }

            pm2.describe(Config.pm2AppName, function (err, description)
            {
                if (!err)
                {
                    description = _.find(description, function (description)
                    {
                        return description.pid === process.pid;
                    });

                    if (!isNull(description))
                    {
                        const errorLogPath = description.pm2_env.pm_err_log_path;
                        const combinedLogPath = description.pm2_env.pm_out_log_path;
                        getLastLinesOfLogs(combinedLogPath, errorLogPath);
                    }
                    else
                    {
                        res.status(500).json({
                            result: "error",
                            message: "Error getting pm2 configuration for current PID when fetching logs!",
                            error: err
                        });
                    }
                }
                else
                {
                    res.status(500).json({
                        result: "error",
                        message: "Error getting pm2 configuration for fetching logs!",
                        error: err
                    });
                }
            });
        });
    }
    else
    {
        const errorLogPath = Logger.getErrorLogFilePath();
        const combinedLogPath = Logger.getLogFilePath();
        getLastLinesOfLogs(combinedLogPath, errorLogPath);
    }
};

module.exports.configuration = function (req, res)
{
    const configFilePath = Pathfinder.absPathInApp("conf/deployment_configs.json");
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    if (req.originalMethod === "GET")
    {
        async.parallel([
            function (cb)
            {
                if (process.env.NODE_ENV === "production")
                {
                    pm2.connect(function (err)
                    {
                        if (err)
                        {
                            console.error(err);
                            process.exit(2);
                        }

                        pm2.describe(Config.pm2AppName, function (err, description)
                        {
                            if (!err)
                            {
                                cb(null, description);
                            }
                            else
                            {
                                res.status(500).json({
                                    result: "error",
                                    message: "Error updating configuration!",
                                    error: err
                                });
                            }
                        });
                    });
                }
                else
                {
                    cb(null, null);
                }
            },
            function (cb)
            {
                fs.readFile(configFilePath, function (err, config)
                {
                    if (isNull(err))
                    {
                        cb(err, JSON.parse(config));
                    }
                    else
                    {
                        Logger.log("error", "Error getting configuration file contents.");
                        cb(err, config);
                    }
                });
            }],
        function (err, results)
        {
            if (isNull(err))
            {
                res.json({
                    config: Config.toJSONObject(),
                    deployment_configs: results[1],
                    pm2_description: results[0]
                });
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Error getting configurations!",
                    error: results
                });
            }
        });
    }
    else if (req.originalMethod === "POST")
    {
        const config = req.body;
        mkdirp(Pathfinder.absPathInApp("conf/deployment_config_backups"), function (err)
        {
            // destination.txt will be created or overwritten by default
            fs.copyFile(configFilePath, path.join(Pathfinder.absPathInApp("conf/deployment_config_backups"), path.basename(configFilePath) + "_" + slug(new Date().toISOString()) + ".bak"), function (err)
            {
                if (isNull(err))
                {
                    fs.writeFile(configFilePath, JSON.stringify(config, null, 4), function (err, result)
                    {
                        if (!err)
                        {
                            res.json({
                                result: "ok",
                                message: "Configuration updated successfully."
                            });
                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "Error updating configuration!",
                                error: err
                            });
                        }
                    });
                }
                else
                {
                    res.status(500).json({
                        result: "error",
                        message: "Error making backup of configuration!",
                        error: err
                    });
                }
            });
        });
    }
};

module.exports.restartServer = function (req, res)
{
    if (process.env.NODE_ENV === "production")
    {
        require(Pathfinder.absPathInSrcFolder("app.js")).reloadPM2Slave(function ()
        {
            process.kill(process.pid, "SIGINT");
        });
    }
    else
    {
        res.status(400).json({
            result: "error",
            message: "This Dendro is not in production mode. The process.env.NODE_ENV is set as " + process.env.NODE_ENV
        });
    }
};
