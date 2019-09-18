const path = require("path");
const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const mkdirp = require("mkdirp");
const pm2 = require("pm2");
const _ = require("underscore");
const async = require("async");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const fs = require("fs");
const yaml = require("js-yaml");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const User = rlequire("dendro", "src/models/user.js").User;
const Project = rlequire("dendro", "src/models/project.js").Project;
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
const DendroMongoClient = rlequire("dendro", "src/kb/mongo.js").DendroMongoClient;

let classesToReindex = [User, Project, Deposit];

let indexingOperationRunning = false;
let lastIndexingOK;

const gfs = Config.getGFSByID();

const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

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

    const rebuildIndex = function (callback, graphShortName, deleteBeforeReindexing)
    {
        if (!isNull(IndexConnection.get(graphShortName)))
        {
            const indexConnection = IndexConnection.get(graphShortName);
            async.series([
                // delete current index if requested
                function (callback)
                {
                    indexConnection.createNewIndex(function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Index " + indexConnection.short_name + " recreated .");
                            return callback(null);
                        }

                        Logger.log("Error recreating index " + indexConnection.short_name + " . " + result);
                        // delete success, move on
                        return callback(1);
                    }, deleteBeforeReindexing);
                },
                // select all elements in the knowledge base
                function (callback)
                {
                    let failed;

                    async.mapLimit(classesToReindex, 3, function (classToReindex, callback)
                    {
                        Logger.log("Reindexing all instances of " + classToReindex.leafClass + " ...");
                        const db = Config.getDBByHandle(graphShortName);
                        if (!isNull(db) && !isNull(db.graphUri))
                        {
                            classToReindex.forAll(
                                function (err, resources)
                                {
                                    if (isNull(err))
                                    {
                                        if (resources.length > 0)
                                        {
                                            async.mapSeries(resources, function (resource, callback)
                                            {
                                                Logger.log("silly", "Resource " + resource.uri + " now being REindexed.");

                                                resource.reindex(function (err, results)
                                                {
                                                    if (err)
                                                    {
                                                        Logger.log("error", "Error indexing Resource " + resource.uri + " : " + results);
                                                        failed = true;
                                                    }

                                                    callback(failed, results);
                                                }, db.graphUri);
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
                                    return callback(err, null);
                                }, db.graphUri
                            );
                        }
                        else
                        {
                            callback(1, "Unable to fetch graph database with uri " + Number(" when reindexing resources of graph with short name ") + graphShortName);
                        }
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

    if (req.body.background)
    {
        if (!indexingOperationRunning)
        {
            indexingOperationRunning = true;
            async.mapSeries(
                graphsToBeIndexed,
                function (graph, cb)
                {
                    if (!isNull(IndexConnection.get(graph)))
                    {
                        const deleteTheIndex = Boolean(_.contains(graphsToDelete, graph));
                        const indexConnection = IndexConnection.get(graph);

                        if (!isNull(indexConnection))
                        {
                            rebuildIndex(function (err, result)
                            {
                                return cb(err, result);
                            }, graph, deleteTheIndex);
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
                    lastIndexingOK = !isNull(err);
                    indexingOperationRunning = false;
                });

            res.render("admin/home",
                {
                    title: "List of available administration operations",
                    info_messages: ["Reindexing graphs " + JSON.stringify(graphsToBeIndexed) + " in background. Wait a while until the operation is concluded."],
                    db: Config.db,
                    indexing: indexingOperationRunning,
                    lastIndexingOK: lastIndexingOK
                }
            );
        }
        else
        {
            res.render("admin/home",
                {
                    title: "List of available administration operations",
                    error_messages: ["Reindexing operation is already running. Wait a while until the operation is concluded."],
                    db: Config.db,
                    indexing: indexingOperationRunning,
                    lastIndexingOK: lastIndexingOK
                }
            );
        }
    }
    else
    {
        async.mapSeries(
            graphsToBeIndexed,
            function (graph, cb)
            {
                if (!isNull(IndexConnection.get(graph)))
                {
                    const deleteTheIndex = Boolean(_.contains(graphsToDelete, graph));
                    const indexConnection = IndexConnection.get(graph);

                    if (!isNull(indexConnection))
                    {
                        rebuildIndex(function (err, result)
                        {
                            return cb(err, result);
                        }, graph, deleteTheIndex);
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
                            db: Config.db,
                            indexing: indexingOperationRunning,
                            lastIndexingOK: lastIndexingOK
                        }
                    );
                }
                else
                {
                    res.render("admin/home",
                        {
                            title: "List of available administration operations",
                            info_messages: ["Resources successfully indexed for graphs " + JSON.stringify(graphsToBeIndexed)],
                            db: Config.db,
                            indexing: indexingOperationRunning,
                            lastIndexingOK: lastIndexingOK
                        }
                    );
                }
            });
    }
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
    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    const configFilePath = Config.activeConfigFilePath;
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
                        cb(err, yaml.safeLoad(config));
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
        mkdirp(rlequire.absPathInApp("dendro", "conf/deployment_config_backups"), function (err)
        {
            // destination.txt will be created or overwritten by default
            fs.copyFile(configFilePath, path.join(rlequire.absPathInApp("dendro", "conf/deployment_config_backups"), path.basename(configFilePath) + "_" + slug(new Date().toISOString()) + ".bak"), function (err)
            {
                if (isNull(err))
                {
                    fs.writeFile(configFilePath, yaml.safeDump(config), function (err, result)
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
        rlequire("dendro", "src/app.js").reloadPM2Slave(function ()
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

const listOrphanResourcesAux = function (callback)
{
    let mongoClient = new DendroMongoClient(Config.mongoDBHost, Config.mongoDbPort, Config.mongoDbCollectionName, Config.mongoDBAuth.username, Config.mongoDBAuth.password, Config.mongoDBAuth.authDatabase);
    mongoClient.connect(function (err, mongoDb)
    {
        if (isNull(err) && !isNull(mongoDb))
        {
            mongoClient.getNonAvatarNorThumbnailFiles(mongoDb, function (err, files)
            {
                if (isNull(err))
                {
                    if (isNull(files))
                    {
                        return callback(null, []);
                    }
                    else if (files.length <= 0)
                    {
                        return callback(null, []);
                    }

                    // Resource.findByUri
                    // resource.delete -> is not possible because resource is null when it does not exist in the graph
                    let resourcesToDeleteInStorage = [];
                    async.mapSeries(files, function (file, cb)
                    {
                        Resource.findByUri(file.filename, function (err, resource)
                        {
                            if (isNull(err))
                            {
                                if (isNull(resource))
                                {
                                    resourcesToDeleteInStorage.push(file.filename);
                                }
                            }
                            cb(err, resource);
                        });
                    }, function (err, result)
                    {
                        callback(err, resourcesToDeleteInStorage);
                    });
                }
                else
                {
                    const message = "Error at getNonAvatarNorThumbnailFiles: " + JSON.stringify(fileUris);
                    Logger.log("error", message);
                    return callback(err, message);
                }
            });
        }
        else
        {
            const msg = "Error when connecting to mongodb, error: " + JSON.stringify(err);
            Logger.log("error", msg);
            return callback(err, msg);
        }
    });
};

const nukeOrphanResourcesAuxFunction = function (callback)
{
    // look for all resources in gridfs
    // for each see if they are in virtuoso graph
    // if true -> do nothing
    // if false -> delete resource in gridfs
    listOrphanResourcesAux(function (err, files)
    {
        if (isNull(err))
        {
            if (!isNull(files) && files.length > 0)
            {
                let constructedQuery = { filename: { $in: files } };
                gfs.connection.deleteByQuery(constructedQuery, function (err, result)
                {
                    if (isNull(err))
                    {
                        callback(err, files);
                    }
                    else
                    {
                        const message = "Error at nuking orphan resources: " + JSON.stringify(result);
                        Logger.log("error", message);
                        callback(err, result);
                    }
                });
            }
            else
            {
                callback(err, []);
            }
        }
        else
        {
            callback(err, files);
        }
    });
};

module.exports.listOrphanResources = function (req, res)
{
    listOrphanResourcesAux(function (err, files)
    {
        if (isNull(err))
        {
            res.json({
                result: "ok",
                message: "There are " + files.length + " orphan resources in gridfs!",
                orphanResources: files
            });
        }
        else
        {
            res.status(500).json({
                result: "error",
                message: JSON.stringify(files)
            });
        }
    });
};

module.exports.nukeOrphanResources = function (req, res)
{
    nukeOrphanResourcesAuxFunction(function (err, files)
    {
        if (isNull(err))
        {
            res.json({
                result: "ok",
                message: "Destroyed " + files.length + " orphan resources successfully.",
                nukedResources: files
            });
        }
        else
        {
            res.status(500).json({
                result: "error",
                message: JSON.stringify(files)
            });
        }
    });
};
