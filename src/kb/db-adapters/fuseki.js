const util = require("util");
const async = require("async");

const rlequire = require("rlequire");
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
                        return callback(null);
                    }
                    return callback(1, "Unable to contact Virtuoso Server at " + self.host + " : " + self.port);
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

        const setupQueryQueues = function (callback)
        {
            self.queue_http = new Queue(
                function (queryObject, popQueueCallback)
                {
                    if (Config.debug.active && Config.debug.database.log_all_queries)
                    {
                        Logger.log("--POSTING QUERY (HTTP): \n" + queryObject.query);
                    }

                    const queryRequest = rp({
                        method: "POST",
                        uri: queryObject.fullUrl,
                        simple: false,
                        form: {
                            query: queryObject.query,
                            maxrows: queryObject.maxRows,
                            format: queryObject.resultsFormat
                        },
                        json: true,
                        forever: true,
                        encoding: "utf8"
                        // timeout : Config.dbOperationTimeout

                    })
                        .then(function (parsedBody)
                        {
                            delete self.pendingRequests[queryObject.query_id];
                            const transformedResults = [];
                            // iterate through all the rows in the result list

                            if (!isNull(parsedBody.boolean))
                            {
                                DbConnection.recordQueryConclusionInLog(queryObject);
                                popQueueCallback();
                                queryObject.callback(null, parsedBody.boolean);
                            }
                            else
                            {
                                if (!isNull(parsedBody.results))
                                {
                                    const rows = parsedBody.results.bindings;
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

                                            let row = parsedBody.results.bindings[i];

                                            if (!isNull(row))
                                            {
                                                transformedResults[i] = {};
                                                for (let j = 0; j < parsedBody.head.vars.length; j++)
                                                {
                                                    let cellHeader = parsedBody.head.vars[j];
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
                                    const msg = "Invalid response from server while running query \n" + queryObject.query + ": " + JSON.stringify(parsedBody, null, 4);
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
                            const error = "Virtuoso server returned error: \n " + util.inspect(err);
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

        async.series([
            checkDatabaseConnectionViaHttp,
            setupQueryQueues
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
                Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to Virtuoso at " + self.host + ":" + self.port + "...");
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

    executeViaHTTP (queryStringWithArguments, argumentsArray, callback, resultsFormat, maxRows, loglevel)
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

                    fullUrl = fullUrl + "/sparql";

                    const uuid = require("uuid");
                    const newQueryId = uuid.v4();
                    self.queue_http.push({
                        queryStartTime: new Date(),
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
