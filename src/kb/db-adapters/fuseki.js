const util = require("util");
const async = require("async");
const request = require("request");

const rlequire = require("rlequire");
const uuid = require("uuid");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const Queue = require("better-queue");
const rp = require("request-promise-native");

class FusekiConnection extends DbConnection
{
    constructor (options)
    {
        super(options);
        const self = this;
        self.dataset = options.dataset;
        self.databaseType = options.dbType;
        self.requestAuth = {
            user: self.username,
            pass: self.password
        };
        self.ontologyGraphs = Object.values(options.ontologyGraphs);
    }

    create (callback)
    {
        const self = this;

        const checkDatabaseConnectionViaHttp = function (callback)
        {
            const xmlHttp = new XMLHttpRequest();
            // prepare callback
            xmlHttp.onreadystatechange = function ()
            {
                if (xmlHttp.readyState === 4)
                {
                    if (xmlHttp.status === 200)
                    {
                        callback(null);
                    }
                    else
                    {
                        callback(1, "Unable to contact Fuseki Server at " + self.host + " : " + self.port);
                    }
                }
            };

            let fullUrl = "http://" + self.host;

            if (self.port)
            {
                fullUrl = fullUrl + ":" + self.port;
            }

            fullUrl = fullUrl + "/$/ping";

            xmlHttp.open("GET", fullUrl, true);
            xmlHttp.send(null);
        };

        const createDatasetIfNeeded = function (callback)
        {
            const checkIfDatasetExists = function (callback)
            {
                let fullUrl = "http://" + self.host;

                if (self.port)
                {
                    fullUrl = fullUrl + ":" + self.port;
                }

                fullUrl = fullUrl + "/$/datasets/" + self.dataset;
                request.get({
                    url: fullUrl,
                    auth: self.requestAuth
                }, function (error, response, body)
                {
                    if (isNull(error))
                    {
                        if (response.statusCode === 404)
                        {
                            callback(error, false);
                        }
                        else
                        {
                            callback(error, true);
                        }
                    }
                    else
                    {
                        callback(error);
                    }
                });
            };

            const createDataset = function (datasetExists, callback)
            {
                if (!datasetExists)
                {
                    let fullUrl = "http://" + self.host;

                    if (self.port)
                    {
                        fullUrl = fullUrl + ":" + self.port;
                    }

                    fullUrl = fullUrl + "/$/datasets";

                    request.post({
                        url: fullUrl,
                        form: {
                            dbType: self.databaseType,
                            dbName: self.dataset
                        },
                        auth: self.requestAuth
                    }, function (err, response, body)
                    {
                        callback(err);
                    });
                }
                else
                {
                    callback(null);
                }
            };

            async.waterfall([
                checkIfDatasetExists,
                createDataset
            ], function (err, results)
            {
                callback(err, results);
            });
        };

        const setupQueryQueues = function (callback)
        {
            self.queue_http = new Queue(
                function (queryObject, popQueueCallback)
                {
                    if (Config.debug.active && Config.debug.database.log_all_queries)
                    {
                        Logger.log("--POSTING QUERY (HTTP): \n" + queryObject.query);
                    }

                    const payload = {
                        method: "POST",
                        uri: queryObject.fullUrl,
                        simple: false,
                        qs: {
                            output: "application/sparql-results+json"
                        },
                        form: {
                            query: DbConnection.getPrefixTrain() + queryObject.query
                            // maxrows: queryObject.maxRows,
                            // format: queryObject.resultsFormat
                        },
                        auth: {
                            user: self.username,
                            pass: self.password
                        },
                        header: {
                            Accept: "application/sparql-results+json"
                        },
                        encoding: "utf8"
                        // json: true,
                        // forever: true,
                        // timeout : Config.dbOperationTimeout
                    };

                    if (queryObject.runAsUpdate)
                    {
                        payload.qs.update = "";
                    }

                    const queryRequest = rp(payload)
                        .then(function (body)
                        {
                            delete self.pendingRequests[queryObject.query_id];
                            body = JSON.parse(body);
                            const transformedResults = [];
                            // iterate through all the rows in the result list

                            if (!isNull(body.boolean))
                            {
                                DbConnection.recordQueryConclusionInLog(queryObject);
                                popQueueCallback();
                                queryObject.callback(null, body.boolean);
                            }
                            else
                            {
                                if (queryObject.runAsUpdate)
                                {
                                    const parseString = require("xml2js").parseString;
                                    parseString(body, function (err, result)
                                    {
                                        if (!err)
                                        {
                                            let parsedResult;
                                            try
                                            {
                                                parsedResult = result.html.body[0].h1[0];
                                            }
                                            catch (e)
                                            {
                                                queryObject.callback(1, "Invalid response from Fuseki server on update. Returned object was " + result);
                                            }

                                            if (parsedResult === "Success")
                                            {
                                                queryObject.callback(null, parsedResult);
                                            }
                                            else
                                            {
                                                queryObject.callback(1, "An Update operation did not succeed: Result from server was \"" + result.html.body.h1 + "\" and should be \"Success\"");
                                            }
                                        }
                                        else
                                        {
                                            return callback(err, result);
                                        }

                                        DbConnection.recordQueryConclusionInLog(queryObject);
                                        popQueueCallback();
                                    });
                                }
                                else if (!isNull(body.results))
                                {
                                    const rows = body.results.bindings;
                                    const numberOfRows = rows.length;

                                    if (numberOfRows === 0)
                                    {
                                        DbConnection.recordQueryConclusionInLog(queryObject);
                                        popQueueCallback();
                                        queryObject.callback(null, []);
                                    }
                                    else
                                    {
                                        for (let i = 0; i < numberOfRows; i++)
                                        {
                                            let dataTypes = [];

                                            let row = body.results.bindings[i];

                                            if (!isNull(row))
                                            {
                                                transformedResults[i] = {};
                                                for (let j = 0; j < body.head.vars.length; j++)
                                                {
                                                    let cellHeader = body.head.vars[j];
                                                    const cell = row[cellHeader];

                                                    if (!isNull(cell))
                                                    {
                                                        let dataType;
                                                        if (!isNull(cell))
                                                        {
                                                            dataType = cell.type;
                                                        }
                                                        else
                                                        {
                                                            dataType = dataTypes[j];
                                                        }

                                                        let value = cell.value;

                                                        switch (dataType)
                                                        {
                                                        case ("http://www.w3.org/2001/XMLSchema#integer"):
                                                        {
                                                            const newInt = parseInt(value);
                                                            transformedResults[" + i + "].header = newInt;
                                                            break;
                                                        }
                                                        case ("uri"):
                                                        {
                                                            transformedResults[i][cellHeader] = value;
                                                            break;
                                                        }
                                                        // default is a string value
                                                        default:
                                                        {
                                                            transformedResults[i][cellHeader] = value;
                                                            break;
                                                        }
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        DbConnection.recordQueryConclusionInLog(queryObject);
                                        popQueueCallback();
                                        queryObject.callback(null, transformedResults);
                                    }
                                }
                                else
                                {
                                    const msg = "Invalid response from server while running query \n" + queryObject.query + ": " + JSON.stringify(body, null, 4);
                                    Logger.log("error", msg);
                                    DbConnection.recordQueryConclusionInLog(queryObject);
                                    popQueueCallback(1, msg);
                                    queryObject.callback(1, "Invalid response from server");
                                }
                            }
                        })
                        .catch(function (err)
                        {
                            delete self.pendingRequests[queryObject.query_id];
                            Logger.log("error", "Query " + queryObject.query_id + " Failed!\n" + queryObject.query + "\n");
                            const error = "Fuseki server returned error: \n " + util.inspect(err);
                            Logger.log("error", error);
                            DbConnection.recordQueryConclusionInLog(queryObject);
                            popQueueCallback(1, error);
                            queryObject.callback(1, error);
                        });

                    self.pendingRequests[queryObject.query_id] = queryRequest;
                },
                {
                    concurrent: self.maxSimultaneousConnections,
                    maxTimeout: self.dbOperationTimeout,
                    maxRetries: 10,
                    // retryDelay : 500,
                    id: "query_id"
                });

            callback(null);
        };

        const loadGraphsIntoDatasetIfNeeded = function (callback)
        {
            const loadGraphOfOntology = function (ontology, callback)
            {
                const checkIfGraphExists = function (ontology, callback)
                {
                    self.graphExists(ontology, function (err, exists)
                    {
                        callback(err, exists);
                    });
                };

                const loadGraph = function (ontology, callback)
                {
                    const queryArguments = [
                        {
                            type: Elements.types.resourceNoEscape,
                            value: ontology.downloadURL
                        },
                        {
                            type: Elements.types.resourceNoEscape,
                            value: ontology.uri
                        }
                    ];

                    self.execute(
                        "CLEAR GRAPH [1]; \n" +
                        "LOAD [0] INTO GRAPH [1];",
                        queryArguments,
                        function (err, result)
                        {
                            callback(err, result);
                        },
                        {
                            runAsUpdate: true
                        });
                };

                checkIfGraphExists(ontology.uri, function (err, exists)
                {
                    if (!err)
                    {
                        if (exists)
                        {
                            callback(null, null);
                        }
                        else
                        {
                            loadGraph(ontology, function (err, result)
                            {
                                callback(err, result);
                            });
                        }
                    }
                    else
                    {
                        callback(err);
                    }
                });
            };

            async.map(
                self.ontologyGraphs,
                loadGraphOfOntology,
                function (err, results)
                {
                    callback(err, results);
                }
            );
        };

        async.series([
            checkDatabaseConnectionViaHttp,
            createDatasetIfNeeded,
            setupQueryQueues,
            loadGraphsIntoDatasetIfNeeded
        ], function (err)
        {
            if (isNull(err))
            {
                callback(err, self);
            }
            else
            {
                callback(err, null);
            }
        });
    }

    tryToConnect (callback)
    {
        const self = this;
        const tryToConnect = function (callback)
        {
            self.create(function (err, db)
            {
                if (isNull(err))
                {
                    if (isNull(db))
                    {
                        const msg = "[ERROR] Unable to connect to Fuseki graph database running on " + self.host + ":" + self.port;
                        Logger.log_boot_message(msg);
                        return callback(msg);
                    }

                    Logger.log_boot_message("Connected to Fuseki graph database running on " + self.host + ":" + self.port);
                    // set default connection. If you want to add other connections, add them in succession.
                    return callback(null);
                }
                callback(1);
            });
        };

        // try calling apiMethod 10 times with linear backoff
        // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
        async.retry({
            times: 240,
            interval: function (retryCount)
            {
                const msecs = 500;
                Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to Fuseki at " + self.host + ":" + self.port + "...");
                return msecs;
            }
        }, tryToConnect, function (err, result)
        {
            if (!isNull(err))
            {
                const msg = "[ERROR] Error connecting to Fuseki graph database running on " + self.host + ":" + self.port;
                Logger.log("error", msg);
                Logger.log("error", err);
                Logger.log("error", result);
            }
            else
            {
                const msg = "Connection to Fuseki at " + self.host + ":" + self.port + " was established!";
                Logger.log("info", msg);
            }
            callback(err);
        });
    }

    close (callback)
    {
        const self = this;

        const closeConnectionPool = function (cb)
        {
            if (self.pool)
            {
                async.map(self.pool._pool, function (connection, cb)
                {
                    self.pool.release(connection, function (err, result)
                    {
                        if (err)
                        {
                            Logger.log("warn", "Exception when closing connection pool to Fuseki.");
                            Logger.log("warn", JSON.stringify(err));
                            Logger.log("warn", JSON.stringify(result));
                        }

                        cb(null);
                    });
                }, function (err, results)
                {
                    cb(err, results);
                });
            }
            else
            {
                cb(null);
            }
        };

        const closePendingConnections = function (callback)
        {
            if (Object.keys(self.pendingRequests).length > 0)
            {
                Logger.log("Telling Fuseki connection " + self.handle + " to abort all queued requests.");
                async.mapSeries(Object.keys(self.pendingRequests), function (queryID, cb)
                {
                    if (self.pendingRequests.hasOwnProperty(queryID))
                    {
                        if (!isNull(self.pendingRequests[queryID]) && self.pendingRequests[queryID].conn)
                        {
                            if (!isNull(self.pendingRequests[queryID].conn))
                            {
                                self.pendingRequests[queryID].conn.commit(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        self.pendingRequests[queryID].conn.close(function (err, result)
                                        {
                                            cb(err, result);
                                        });
                                    }
                                    else
                                    {
                                        cb(null);
                                    }
                                });
                            }
                            else
                            {
                                cb(null);
                            }
                        }
                        else
                        {
                            cb(null);
                        }
                    }
                    else
                    {
                        cb(null);
                    }
                }, function (err, result)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "Unable to cleanly cancel all requests in the Fuseki database connections queue.");
                        Logger.log("error", JSON.stringify(err));
                        Logger.log("error", JSON.stringify(result));
                    }
                });
            }
            else
            {
                Logger.log("No queued requests in Fuseki connection " + self.handle + ". Continuing cleanup...");
                callback(null);
            }
        };

        const destroyQueues = function (callback)
        {
            const stats = self.queue_http.getStats();
            Logger.log("Fuseki DB Query Queue stats " + JSON.stringify(stats));

            async.series([
                function (callback)
                {
                    self.queue_http.destroy(function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Unable to cleanly destroy e the Fuseki database connections queue.");
                            Logger.log("error", JSON.stringify(err));
                            Logger.log("error", JSON.stringify(result));
                        }

                        callback(err, result);
                    });
                }
            ], callback);
        };

        async.series([
            closePendingConnections,
            closeConnectionPool,
            destroyQueues
        ], function (err, result)
        {
            callback(err, result);
        });
    }

    execute (queryStringWithArguments, argumentsArray, callback, options)
    {
        const self = this;

        if (options instanceof Object)
        {
            self._executeViaHTTP(queryStringWithArguments, argumentsArray, callback, options.resultsFormat, options.maxRows, options.runAsUpdate);
        }
        else
        {
            self._executeViaHTTP(queryStringWithArguments, argumentsArray, callback);
        }
    }

    _executeViaHTTP (queryStringWithArguments, argumentsArray, callback, resultsFormat, maxRows, runAsUpdate)
    {
        const self = this;

        DbConnection.queryObjectToString(queryStringWithArguments, argumentsArray, function (err, query)
        {
            if (isNull(err))
            {
                if (self.host && self.port)
                {
                    // by default, query format will be json
                    if (isNull(resultsFormat))
                    {
                        resultsFormat = "application/json";
                    }

                    // by default, query format will be json
                    if (isNull(maxRows))
                    {
                        maxRows = Config.limits.db.maxResults;
                    }

                    let fullUrl = "http://" + self.host;
                    if (self.port)
                    {
                        fullUrl = fullUrl + ":" + self.port;
                    }

                    fullUrl = fullUrl + "/" + self.dataset;

                    if (runAsUpdate)
                    {
                        fullUrl = fullUrl + "/update";
                    }
                    else
                    {
                        fullUrl = fullUrl + "/query";
                    }

                    const newQueryId = uuid.v4();
                    self.queue_http.push({
                        queryStartTime: new Date(),
                        runAsUpdate: runAsUpdate,
                        query: query,
                        callback: callback,
                        query_id: newQueryId,
                        fullUrl: fullUrl,
                        resultsFormat: resultsFormat,
                        maxRows: maxRows
                    });
                }
                else
                {
                    return callback(1, "Database connection must be set first");
                }
            }
            else
            {
                const msg = "Something went wrong with the query generation. Error reported: " + query;
                Logger.log("error", msg);
                return callback(1, msg);
            }
        });
    }

    deleteGraph (graphUri, callback)
    {
        const self = this;

        const runQuery = function (callback)
        {
            self.execute("CLEAR GRAPH <" + graphUri + ">",
                [],
                function (err, resultsOrErrMessage)
                {
                    return callback(err, resultsOrErrMessage);
                },
                {
                    runAsUpdate: true
                }
            );
        };

        if (Config.cache.active)
        {
            // Invalidate cache record for the updated resource
            const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
            // Invalidate whole cache for this graph

            let graphCache;

            graphCache = Cache.getByGraphUri(graphUri);

            graphCache.deleteAll(function (err, result)
            {
                if (err)
                {
                    Logger.log("debug", "Exception deleting all cache records for " + graphUri + ".");
                    Logger.log("debug", JSON.stringify(err));
                    Logger.log("debug", JSON.stringify(result));
                }

                runQuery(callback);
            });
        }
        else
        {
            runQuery(callback);
        }
    }

    graphExists (graphUri, callback)
    {
        const self = this;
        self.execute("ASK WHERE { GRAPH [0] { ?s ?p ?o . } }",
            [
                {
                    type: Elements.types.resourceNoEscape,
                    value: graphUri
                }
            ],
            function (err, result)
            {
                if (isNull(err))
                {
                    if (result === true)
                    {
                        return callback(err, true);
                    }
                    return callback(err, false);
                }
                return callback(err, null);
            }
        );
    }
}

module.exports.FusekiConnection = FusekiConnection;
