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
const jinst = require("jdbc/lib/jinst");
const Pool = require("jdbc/lib/pool");

class VirtuosoConnection extends DbConnection
{
    constructor (options)
    {
        super(options);
        const self = this;
        self.virtuosoSQLLogLevel = options.virtuosoSQLLogLevel;
        self.port_isql = options.portISQL;
        self.virtuosoConnector = options.virtuosoConnector;
        self.virtuosoSQLLogLevel = options.virtuosoSQLLogLevel;
    }

    sendQueryViaJDBC (query, queryId, callback, runAsUpdate)
    {
        const self = this;
        if (Config.debug.active && Config.debug.database.log_all_queries)
        {
            Logger.log("--EXECUTING QUERY (JDBC) : \n" + query);
        }

        const queryStartTime = new Date();

        const reserveConnection = function (callback)
        {
            self.pool.reserve(function (err, connection)
            {
                if (isNull(err))
                {
                    async.series([
                        function (callback)
                        {
                            // connection.conn.setAutoCommit(true, callback);
                            callback(null);
                        }
                    ], function (err, results)
                    {
                        if (isNull(err))
                        {
                            self.pendingRequests[queryId] = connection;
                            callback(null, connection);
                        }
                        else
                        {
                            Logger.log("error", "Error while setting connection for running queries");
                            Logger.log("error", JSON.stringify(err));
                            Logger.log("error", JSON.stringify(results));
                            callback(null, connection);
                        }
                    });
                }
                else
                {
                    Logger.log("error", "Error while reserving connection for running query");
                    Logger.log("error", JSON.stringify(err));
                    Logger.log("error", JSON.stringify(connection));
                    callback(err, connection);
                }
            });
        };

        const executeQueryOrUpdate = function (connection, callback)
        {
            connection.conn.createStatement(function (err, statement)
            {
                if (isNull(err))
                {
                    // difference between query and procedure (does not return anything. needed for deletes and inserts)
                    if (!isNull(runAsUpdate))
                    {
                        statement.executeUpdate(query, function (err, results)
                        {
                            if (isNull(err))
                            {
                                if (Config.debug.active && Config.debug.database.log_all_queries)
                                {
                                    Logger.log(JSON.stringify(results));
                                }

                                if (!isNull(err))
                                {
                                    Logger.log("error", "Error Running Update Statement \n" + query);
                                    Logger.log("error", JSON.stringify(err));
                                    Logger.log("error", err.stack);
                                    Logger.log("error", JSON.stringify(results));
                                }

                                statement.close(function (err, result)
                                {
                                    if (!isNull(err))
                                    {
                                        Logger.log("error", "Error closing statement on update statement");
                                        Logger.log("error", JSON.stringify(err));
                                        Logger.log("error", JSON.stringify(result));
                                    }

                                    callback(err, results);
                                });
                            }
                            else
                            {
                                callback(err, results);
                            }
                        });
                    }
                    else
                    {
                        statement.executeQuery(query, function (err, resultset)
                        {
                            if (err)
                            {
                                callback(err);
                            }
                            else
                            {
                                // Convert the result set to an object array.
                                resultset.toObjArray(function (err, results)
                                {
                                    if (!isNull(err))
                                    {
                                        Logger.log("error", "Error Running Query \n" + query);
                                        Logger.log("error", JSON.stringify(err));
                                        Logger.log("error", JSON.stringify(err.stack));
                                        Logger.log("error", JSON.stringify(results));
                                    }

                                    statement.close(function (err, result)
                                    {
                                        if (!isNull(err))
                                        {
                                            Logger.log("error", "Error closing statement on query statement");
                                            Logger.log("error", JSON.stringify(err));
                                            Logger.log("error", JSON.stringify(result));
                                        }

                                        callback(err, results);
                                    });
                                });
                            }
                        });
                    }
                }
                else
                {
                    callback(err);
                }
            });
        };

        const releaseConnection = function (connection, callback)
        {
            if (!isNull(self.pool))
            {
                self.pool.release(connection, function (err, result)
                {
                    if (!isNull(connection))
                    {
                        const endIt = function (callback)
                        {
                            if (isNull(err))
                            {
                                callback(null);
                            }
                            else
                            {
                                Logger.log("error", "Error releasing JDBC connection on pool of database " + self.handle);
                                Logger.log("error", JSON.stringify(err));
                                Logger.log("error", JSON.stringify(connection));
                                callback(err, connection);
                            }
                        };

                        endIt(callback);
                    }
                    else
                    {
                        callback(null, null);
                    }
                });
            }
            else
            {
                callback(null);
            }
        };

        reserveConnection(function (err, connection)
        {
            if (isNull(err))
            {
                executeQueryOrUpdate(connection, function (err, results)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "########################   Error executing query ########################   \n" + query + "\n########################   Via JDBC ON Virtuoso   ########################   ");
                        Logger.log("error", JSON.stringify(err));
                        Logger.log("error", JSON.stringify(err.cause));
                        Logger.log("error", JSON.stringify(err.message));
                        Logger.log("error", JSON.stringify(err.stack));
                        Logger.log("error", JSON.stringify(results));
                    }

                    DbConnection.recordQueryConclusionInLog(query, queryStartTime);

                    let released = false;
                    const timeout = setTimeout(function ()
                    {
                        if (!released)
                        {
                            const msg = "Unable to release connection in time, sending an error!!";
                            Logger.log(msg);
                            callback(1, msg);
                        }
                    }, 10000);

                    releaseConnection(connection, function (err, result)
                    {
                        clearTimeout(timeout);

                        delete self.pendingRequests[queryId];
                        callback(err, results);
                    });
                });
            }
            else
            {
                // giving error but works... go figure. Commenting for now.
                const msg = "Error occurred while reserving connection from JDBC connection pool of database " + self.handle;
                Logger.log("error", err.message);
                Logger.log("error", err.stack);
                Logger.log("error", msg);
            }
        });
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

            xmlHttp.open("GET", fullUrl, true);
            xmlHttp.send(null);
        };

        const checkDatabaseConnectionViaJDBC = function (callback)
        {
            if (!jinst.isJvmCreated())
            {
                jinst.addOption("-Xrs");
                jinst.setupClasspath([
                    rlequire.absPathInApp("dendro", "conf/virtuoso-jdbc/jdbc-4.2/virtjdbc4_2.jar")
                ]);
            }

            // Working config in Dendro PRD, 22-12-2017
            // const timeoutSecs = 10;
            // const config = {
            //     // Required
            //     url: `jdbc:virtuoso://${self.host}:${self.port_isql}/UID=${self.username}/PWD=${self.password}/PWDTYPE=cleartext/CHARSET=UTF-8/TIMEOUT=${timeoutSecs}`,
            //     drivername: "virtuoso.jdbc4.Driver",
            //     maxpoolsize: Math.ceil(self.maxSimultaneousConnections / 2),
            //     minpoolsize: 1,
            //     // 10 seconds idle time
            //     maxidle: 1000 * timeoutSecs,
            //     properties: {}
            // };

            const timeoutSecs = 60;
            const config = {
                // Required
                url: `jdbc:virtuoso://${self.host}:${self.port_isql}/UID=${self.username}/PWD=${self.password}/PWDTYPE=cleartext/CHARSET=UTF-8/TIMEOUT=${timeoutSecs}`,
                drivername: "virtuoso.jdbc4.Driver",
                maxpoolsize: self.maxSimultaneousConnections,
                minpoolsize: Math.ceil(self.maxSimultaneousConnections / 2),
                // 600 seconds idle time (should be handled by the TIMEOUT setting, but we specify this to kill any dangling connections...
                // maxidle: 1000 * timeoutSecs * 10,
                properties: {}
            };

            const pool = new Pool(config);

            pool.initialize(function (err, result)
            {
                if (err)
                {
                    Logger.log("error", "Error initializing Virtuoso connection pool: " + JSON.stringify(err) + " RESULT: " + JSON.stringify(result));
                    callback(err, result);
                }
                else
                {
                    self.pool = pool;
                    callback(null, self);
                }
            });
        };

        const setupQueryQueues = function (callback)
        {
            self.queue_jdbc = new Queue(
                function (queryObject, popQueueCallback)
                {
                    self.sendQueryViaJDBC(queryObject.query, queryObject.query_id, function (err, results)
                    {
                        queryObject.callback(err, results);
                        popQueueCallback();
                    }, queryObject.runAsUpdate);
                },
                {
                    concurrent: 1,
                    maxTimeout: self.dbOperationTimeout,
                    maxRetries: 10,
                    // retryDelay : 100,
                    id: "query_id"
                });

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
                                            let datatypes = [];

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
                                                        let datatype;
                                                        if (!isNull(cell))
                                                        {
                                                            datatype = cell.type;
                                                        }
                                                        else
                                                        {
                                                            datatype = datatypes[j];
                                                        }

                                                        let value = cell.value;

                                                        switch (datatype)
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
            checkDatabaseConnectionViaJDBC,
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
                        const msg = "[ERROR] Unable to connect to Virtuoso graph database running on " + self.host + ":" + self.port;
                        Logger.log_boot_message(msg);
                        return callback(msg);
                    }

                    Logger.log_boot_message("Connected to Virtuoso graph database running on " + self.host + ":" + self.port);
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
                const msg = "[ERROR] Error connecting to Virtuoso graph database running on " + self.host + ":" + self.port;
                Logger.log("error", msg);
                Logger.log("error", err);
                Logger.log("error", result);
            }
            else
            {
                const msg = "Connection to Virtuoso at " + self.host + ":" + self.port + " was established!";
                Logger.log("info", msg);
            }
            callback(err);
        });
    }

    close (callback)
    {
        // silvae86
        // THIS FUNCTION IS A CONSEQUENCE OF VIRTUOSO's QUALITY AND MY STUPIDITY
        // CONNECTIONS ARE NEVER CLOSED EVEN WITH PURGE METHOD!!!!
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
                            Logger.log("warn", "Exception when closing connection pool to virtuoso.");
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
                Logger.log("Telling Virtuoso connection " + self.handle + " to abort all queued requests.");
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
                        Logger.log("error", "Unable to cleanly cancel all requests in the Virtuoso database connections queue.");
                        Logger.log("error", JSON.stringify(err));
                        Logger.log("error", JSON.stringify(result));
                    }
                });
            }
            else
            {
                Logger.log("No queued requests in Virtuoso connection " + self.handle + ". Continuing cleanup...");
                callback(null);
            }
        };

        const destroyQueues = function (callback)
        {
            const stats = self.queue_http.getStats();
            Logger.log("Virtuoso DB Query Queue stats " + JSON.stringify(stats));

            async.series([
                function (callback)
                {
                    self.queue_http.destroy(function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Unable to cleanly destroy e the Virtuoso database connections queue.");
                            Logger.log("error", JSON.stringify(err));
                            Logger.log("error", JSON.stringify(result));
                        }

                        callback(err, result);
                    });
                },
                function (callback)
                {
                    self.queue_jdbc.destroy(function (err, result)
                    {
                        callback(err, result);
                    });
                }
            ], callback);
        };

        const sendCheckpointCommand = function (callback)
        {
            Logger.log("Committing pending transactions via checkpoint; command before shutting down virtuoso....");
            self.executeViaJDBC(
                "EXEC=checkpoint;",
                [],
                function (err, result)
                {
                    if (!isNull(err))
                    {
                        Logger.log("error", "Error committing pending transactions via checkpoint; command before shutting down virtuoso.");
                        Logger.log("error", err);
                        Logger.log("error", result);
                        callback(err, result);
                    }
                    else
                    {
                        callback(null, result);
                    }
                }, null, null, null, true, true
            );

            callback(null);
        };

        const shutdownVirtuoso = function (callback)
        {
            callback(null);

            // if (Config.docker.active && Config.docker.start_and_stop_containers_automatically)
            // {
            //     Logger.log("Shutting down virtuoso....!");
            //     self.executeViaJDBC(
            //         "EXEC=checkpoint; shutdown;",
            //         [],
            //         function (err, result)
            //         {
            //             if (!isNull(err))
            //             {
            //                 Logger.log("error", "Error shutting down virtuoso.");
            //                 Logger.log("error", err);
            //                 Logger.log("error", result);
            //                 callback(err, result);
            //             }
            //             else
            //             {
            //                 callback(null, result);
            //             }
            //         }, null, null, null, true, true
            //     );
            // }
            // else
            // {
            //     callback(null);
            // }
        };

        async.series([
            sendCheckpointCommand,
            closePendingConnections,
            closeConnectionPool,
            destroyQueues,
            shutdownVirtuoso
        ], function (err, result)
        {
            callback(err, result);
        });
    }

    execute(queryStringWithArguments, argumentsArray, callback, options)
    {
        const self = this;
        if(self.virtuosoConnector === "http")
        {

        }
        else if(self.virtuosoConnector === "jdbc")
        {

        }
        else
        {
            throw new Error("Invalid virtuoso connector type: " + self.virtuosoConnector);
        }

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

                    let fullUrl = null;

                    fullUrl = "http://" + self.host;
                    if (self.port)
                    {
                        fullUrl = fullUrl + ":" + self.port;
                    }

                    fullUrl = fullUrl + "/sparql";

                    if (!isNull(loglevel))
                    {
                        query = "DEFINE sql:log-enable " + loglevel + "\n" + query;
                    }
                    else
                    {
                        query = "DEFINE sql:log-enable " + self.virtuosoSQLLogLevel + "\n" + query;
                    }

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

    executeViaJDBC (queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, loglevel, runAsUpdate, notSPARQL)
    {
        const self = this;

        DbConnection.queryObjectToString(queryStringOrArray, argumentsArray, function (err, query)
        {
            if (isNull(err))
            {
                if (!isNull(self.pool))
                {
                    // Add SPARQL keyword at the start of the query
                    if (isNull(notSPARQL) || !isNull(notSPARQL) && notSPARQL === false)
                    {
                        query = "SPARQL\n" + query;
                    }

                    // Uncomment to use JDBC-controlled query queuing
                    // self.sendQueryViaJDBC(
                    //     query,
                    //     uuid.v4(),
                    //     function (err, results)
                    //     {
                    //         callback(err, results);
                    //     },
                    //     runAsUpdate
                    // );

                    // Uncomment to use NodeJS Query queues for concurrency control
                    const uuid = require("uuid");
                    const newQueryId = uuid.v4();
                    self.queue_jdbc.push({
                        queryStartTime: new Date(),
                        query: query,
                        query_id: newQueryId,
                        runAsUpdate: runAsUpdate,
                        callback: function (err, results)
                        {
                            callback(err, results);
                        }
                    });
                }
                else
                {
                    return callback(1, "Database JDBC connection must be set first");
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
            self.executeViaJDBC("CLEAR GRAPH <" + graphUri + ">",
                [],
                function (err, resultsOrErrMessage)
                {
                    return callback(err, resultsOrErrMessage);
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

        self.executeViaJDBC("ASK { GRAPH [0] { ?s ?p ?o . } }",
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

module.exports.VirtuosoConnection = VirtuosoConnection;
