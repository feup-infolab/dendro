const util = require("util");
const async = require("async");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Queue = require("better-queue");
const rp = require("request-promise-native");
const uuid = require("uuid");
const jinst = require("jdbc/lib/jinst");
const Pool = require("jdbc/lib/pool");

let bootStartTimestamp = new Date().toISOString();
const profilingLogFileSeparator = "@";

const queryObjectToString = function (query, argumentsArray, callback)
{
    let transformedQuery = "";

    if (query instanceof Array)
    {
        for (let i = 0; i < query.length; i++)
        {
            transformedQuery += query[i] + "\n";
            transformedQuery += ";\n";
        }
    }
    else if (typeof query === "string")
    {
        transformedQuery = query;
    }

    for (let i = 0; i < argumentsArray.length; i++)
    {
        const currentArgumentIndex = "[" + i + "]";
        const currentArgument = argumentsArray[i];

        // check for the presence of the parameter placeholder
        if (transformedQuery.indexOf(currentArgumentIndex) !== -1)
        {
            try
            {
                // will allow people to use the same parameter several times in the query,
                // for example [0]....[0]...[0] by replacing all occurrences of [0] in the query string
                // [] are reserved chars in regex!
                const pattern = new RegExp("\\[" + i + "\\]", "g");

                switch (currentArgument.type)
                {
                case Elements.types.resourceNoEscape:
                    transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                    break;
                case Elements.types.resource:
                    transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                    break;
                case Elements.types.property:
                    transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                    break;
                case Elements.types.string:
                    const findAllQuotationMarksRegex = new RegExp("'", "g");
                    const stringWithEscapedQuotationMarks = currentArgument.value.replace(findAllQuotationMarksRegex, "\\'");
                    transformedQuery = transformedQuery.replace(pattern, "'''" + stringWithEscapedQuotationMarks + "'''");
                    break;
                case Elements.types.int:
                    transformedQuery = transformedQuery.replace(pattern, currentArgument.value);
                    break;
                case Elements.types.double:
                    transformedQuery = transformedQuery.replace(pattern, currentArgument.value);
                    break;
                case Elements.types.boolean:
                    let booleanForm;
                    try
                    {
                        booleanForm = JSON.parse(currentArgument.value);
                    }
                    catch (e)
                    {
                        if (!(booleanForm === true || booleanForm === false))
                        {
                            const msg = "Unable to convert argument [" + i + "]: It is set as a bolean, but the value is not true or false, it is : " + currentArgument.value;
                            Logger.log("error", msg);
                            return callback(1, msg);
                        }
                    }

                    transformedQuery = transformedQuery.replace(pattern, "\"" + booleanForm.toString() + "\"");

                    break;
                case Elements.types.prefixedResource:
                    const validator = require("validator");
                    if (validator.isURL(currentArgument.value))
                    {
                        transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                    }
                    else
                    {
                        if (!isNull(currentArgument.value))
                        {
                            const indexOfColon = currentArgument.value.indexOf(":");
                            const indexOfHash = currentArgument.value.indexOf("#");
                            let indexOfSeparator;

                            if (indexOfColon < 0 && indexOfHash > -1)
                            {
                                indexOfSeparator = indexOfHash;
                            }
                            else if (indexOfColon > -1 && indexOfHash < 0)
                            {
                                indexOfSeparator = indexOfColon;
                            }

                            if (indexOfSeparator > 0)
                            {
                                if (!isNull(currentArgument.value))
                                {
                                    const prefix = currentArgument.value.substr(0, indexOfSeparator);
                                    const element = currentArgument.value.substr(indexOfSeparator + 1);

                                    const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
                                    const ontology = Ontology.allOntologies[prefix].uri;
                                    const valueAsFullUri = ontology + element;

                                    transformedQuery = transformedQuery.replace(pattern, "<" + valueAsFullUri + ">");
                                }
                                else
                                {
                                    const error = "Value of argument " + currentArgument.value + " is null. Query supplied was :\n " + query + " \n " + JSON.stringify(arguments);
                                    Logger.log("error", error);
                                    return callback(1, error);
                                }
                            }
                            else
                            {
                                const error = "Value of argument " + currentArgument.value + " is not valid for an argument of type Prefixed Resource... Did you mean to parametrize it as a string type in the elements.js file?. Query supplied was : \n" + query + " \n " + JSON.stringify(arguments);
                                Logger.log("error", error);
                                return callback(1, error);
                            }
                        }
                        else
                        {
                            const error = "Cannot Execute Query: Value of argument at index " + currentArgumentIndex + " is undefined. Query supplied was :\n " + query + " \n " + JSON.stringify(arguments);
                            Logger.log("error", error);
                            return callback(1, error);
                        }
                    }
                    break;
                case Elements.types.date:
                    transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                    break;
                case Elements.types.long_string:
                    transformedQuery = transformedQuery.replace(pattern, "'''" + currentArgument.value + "'''");
                    break;
                case Elements.types.stringNoEscape:
                    transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                    break;
                default: {
                    const error = "Unknown argument type for argument in position " + i + " with value " + currentArgument.value + ". Query supplied was \n: " + query + " \n " + JSON.stringify(arguments);
                    Logger.log("error", error);
                    return callback(1, error);
                }
                }
            }
            catch (e)
            {
                Logger.log("error", "Error processing argument " + currentArgumentIndex + " in query: \n----------------------\n\n" + transformedQuery + "\n----------------------");
                Logger.log("error", "Value of Argument " + currentArgumentIndex + ": " + currentArgument.value);
                if (!isNull(e.stack))
                {
                    Logger.log("error", e.stack);
                }
                else
                {
                    Logger.log("error", JSON.stringify(e));
                }

                throw e;
            }
        }
        else
        {
            const error = "Error in query " + query + "; Unable to find argument with index " + i + " .";
            Logger.log("error", error);
            return callback(1, error);
        }
    }

    return callback(null, transformedQuery);
};

const recordQueryConclusionInLog = function (query, queryStartTime)
{
    const logParentFolder = Pathfinder.absPathInApp("profiling");
    const queryProfileLogFilePath = path.join(logParentFolder, "database_profiling_" + bootStartTimestamp + ".csv");

    if (Config.debug.database.log_query_times)
    {
        const msec = new Date().getTime() - queryStartTime.getTime();
        let fd;

        if (!fs.existsSync(logParentFolder))
        {
            mkdirp.sync(logParentFolder);
            // truncate / create blank file
            fd = fs.openSync(queryProfileLogFilePath, "a");
            fs.appendFileSync(queryProfileLogFilePath, "query" + profilingLogFileSeparator + "time_msecs\n");
            fs.closeSync(fd);
        }

        // truncate / create blank file
        fd = fs.openSync(queryProfileLogFilePath, "a");
        const cleanedQuery = query
            .replace(/(?:\r\n|\r|\n)/g, "")
            .replace(/\/r\/([a-z]|_|-|[0-9])+\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "an_uri");

        fs.appendFileSync(
            queryProfileLogFilePath,
            cleanedQuery + profilingLogFileSeparator + msec + "\n");

        fs.closeSync(fd);
    }
};

let DbConnection = function (handle, host, port, portISQL, username, password, maxSimultaneousConnections, dbOperationsTimeout)
{
    let self = this;

    if (!self.host || !self.port)
    {
        self.host = host;
        self.port = port;
        self.port_isql = portISQL;
        self.username = username;
        self.password = password;

        if (isNull(maxSimultaneousConnections))
        {
            self.maxSimultaneousConnections = 1;
        }
        else
        {
            self.maxSimultaneousConnections = maxSimultaneousConnections;
        }
    }

    self.handle = handle;
    self.dbOperationTimeout = dbOperationsTimeout;
    self.pendingRequests = {};
    self.databaseName = "graph";
    self.created_profiling_logfile = false;
};

DbConnection.prototype.sendQueryViaJDBC = function (query, queryId, callback, runAsUpdate)
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

    const releaseConnection = function (connection, callback)
    {
        if (!isNull(self.pool))
        {
            self.pool.release(connection, function (err, connection)
            {
                if (isNull(err))
                {
                    delete self.pendingRequests[queryId];
                    delete self.pendingRequests[queryId];
                    callback(null);
                }
                else
                {
                    Logger.log("error", "Error releasing JDBC connection on pool of database " + self.id);
                    Logger.log("error", JSON.stringify(err));
                    Logger.log("error", JSON.stringify(connection));
                    callback(err, connection);
                }
            });
        }
        else
        {
            callback(null);
        }
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

                recordQueryConclusionInLog(query, queryStartTime);

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
};

DbConnection.finishUpAllConnectionsAndClose = function (callback)
{
    let exited = false;
    // we also register another handler if virtuoso connections take too long to close
    setTimeout(function ()
    {
        if (!exited)
        {
            Logger.log("error", "[TIMEOUT] Virtuoso did not close all connections in time!");
            callback(null);
        }
    }, Config.dbOperationTimeout * 10);

    async.mapSeries(Object.keys(Config.db), function (dbConfigKey, cb)
    {
        const dbConfig = Config.db[dbConfigKey];

        if (!isNull(dbConfig.connection) && dbConfig.connection instanceof DbConnection)
        {
            dbConfig.connection.finishUpAndClose(function (err, result)
            {
                if (isNull(err))
                {
                    Logger.log("Virtuoso connection " + dbConfig.connection.databaseName + " closed gracefully.");
                    cb(null, result);
                }
                else
                {
                    Logger.log("error", "Error closing Virtuoso connection " + dbConfig.connection.databaseName + ".");
                    Logger.log("error", err);
                    cb(err, result);
                }
            });
        }
        else
        {
            cb(null, null);
        }
    }, function (err, result)
    {
        exited = true;
        callback(err, result);
    });
};

DbConnection.addLimitsClauses = function (query, offset, maxResults)
{
    if (!isNull(offset) &&
        typeof offset === "number" &&
        offset > 0)
    {
        query = query + " OFFSET " + offset + "\n";
    }

    if (!isNull(maxResults) &&
        typeof maxResults === "number" &&
        maxResults > 0)
    {
        query = query + " LIMIT " + maxResults + " \n";
    }

    return query;
};

DbConnection.pushLimitsArguments = function (unpaginatedArgumentsArray, maxResults, offset)
{
    if (
        !isNull(offset) &&
        typeof offset === "number" &&
        offset > 0 &&
        !isNaN(offset)
    )
    {
        unpaginatedArgumentsArray.push({
            type: Elements.types.int,
            value: offset
        });
    }

    if (
        !isNull(maxResults) &&
        typeof maxResults === "number" &&
        maxResults > 0 &&
        !isNaN(maxResults)
    )
    {
        unpaginatedArgumentsArray.push({
            type: Elements.types.int,
            value: maxResults
        });
    }

    return unpaginatedArgumentsArray;
};

DbConnection.paginate = function (req, viewVars)
{
    if (!isNull(req) && !isNull(req.query))
    {
        if (!req.query.currentPage)
        {
            viewVars.currentPage = 0;
        }
        else
        {
            // avoid injections
            viewVars.currentPage = parseInt(req.query.currentPage);
        }

        if (!req.query.pageSize)
        {
            viewVars.pageSize = 20;
        }
        else
        {
            // avoid injections
            viewVars.pageSize = parseInt(req.query.pageSize);
        }
    }

    return viewVars;
};

DbConnection.paginateQuery = function (req, query)
{
    if (!isNull(req) && !isNull(req.query))
    {
        if (isNull(req.query.currentPage))
        {
            req.query.currentPage = 0;
        }
        else
        {
            // avoid injections
            req.query.currentPage = parseInt(req.query.currentPage);
        }

        if (!req.query.pageSize)
        {
            req.query.pageSize = 20;
        }
        else
        {
            // avoid injections
            req.query.pageSize = parseInt(req.query.pageSize);
        }

        const skip = req.query.pageSize * req.query.currentPage;

        if (req.query.pageSize > 0)
        {
            query = query + " LIMIT " + req.query.pageSize;
        }

        if (skip > 0)
        {
            query = query + " OFFSET " + skip;
        }
    }

    return query;
};

DbConnection.buildFromStringAndArgumentsArrayForOntologies = function (ontologyURIsArray, startingArgumentCount)
{
    let i;
    let fromString = "";
    const argumentsArray = [];

    for (i = 0; i < ontologyURIsArray.length; i++)
    {
        // arguments array starts with 2 fixed elements
        const argIndex = i + startingArgumentCount;

        fromString = fromString + " FROM [" + argIndex + "] \n";

        argumentsArray.push(
            {
                type: Elements.types.resourceNoEscape,
                value: ontologyURIsArray[i]
            }
        );
    }

    return {
        fromString: fromString,
        argumentsArray: argumentsArray
    };
};

DbConnection.buildFilterStringForOntologies = function (ontologyURIsArray, filteredVariableName)
{
    let filterString = "";

    if (!isNull(ontologyURIsArray) && ontologyURIsArray instanceof Array)
    {
        if (ontologyURIsArray.length > 0)
        {
            filterString = filterString + "FILTER( ";

            for (let i = 0; i < ontologyURIsArray.length; i++)
            {
                const ontologyUri = ontologyURIsArray[i];
                filterString = filterString + " STRSTARTS(STR(?" + filteredVariableName + "), \"" + ontologyUri + "\") ";

                if (i < ontologyURIsArray.length - 1)
                {
                    filterString = filterString + " || ";
                }
            }

            filterString = filterString + ") .";
        }
    }

    return filterString;
};

DbConnection.prototype.create = function (callback)
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
                Pathfinder.absPathInApp("conf/virtuoso-jdbc/jdbc-4.2/virtjdbc4_2.jar")
            ]);
        }

        // Working config in Dendro PRD, 22-12-2017
        /*
        const timeoutSecs = 10;
        const config = {
            // Required
            url: `jdbc:virtuoso://${self.host}:${self.port_isql}/UID=${self.username}/PWD=${self.password}/PWDTYPE=cleartext/CHARSET=UTF-8/TIMEOUT=${timeoutSecs}`,
            drivername: "virtuoso.jdbc4.Driver",
            maxpoolsize: Math.ceil(self.maxSimultaneousConnections / 2),
            minpoolsize: 1,
            // 10 seconds idle time
            maxidle: 1000 * timeoutSecs,
            properties: {}
        };*/

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
                Logger.log("error", "Error initializing Virtuoso connection pool: " + JSON.stringify(err));
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
                            recordQueryConclusionInLog(queryObject);
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
                                    recordQueryConclusionInLog(queryObject);
                                    popQueueCallback();
                                    queryObject.callback(null, []);
                                }
                                else
                                {
                                    for (let i = 0; i < numberOfRows; i++)
                                    {
                                        let datatypes = [];
                                        let columnHeaders = [];

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

                                    recordQueryConclusionInLog(queryObject);
                                    popQueueCallback();
                                    queryObject.callback(null, transformedResults);
                                }
                            }
                            else
                            {
                                const msg = "Invalid response from server while running query \n" + queryObject.query + ": " + JSON.stringify(parsedBody, null, 4);
                                Logger.log("error", msg);
                                recordQueryConclusionInLog(queryObject);
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
                        recordQueryConclusionInLog(queryObject);
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
};

DbConnection.prototype.tryToConnect = function (callback)
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
                    const msg = "[ERROR] Unable to connect to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort;
                    Logger.log_boot_message(msg);
                    return callback(msg);
                }

                Logger.log_boot_message("Connected to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort);
                // set default connection. If you want to add other connections, add them in succession.
                return callback(null);
            }
            callback(1);
        });
    };

    // try calling apiMethod 10 times with linear backoff
    // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
    async.retry({
        times: 10,
        interval: function (retryCount)
        {
            const msecs = 50 * Math.pow(2, retryCount);
            Logger.log("Waiting " + msecs / 1000 + " seconds to retry a connection to Virtuoso...");
            return msecs;
        }
    }, tryToConnect, function (err, result)
    {
        if (!isNull(err))
        {
            const msg = "[ERROR] Error connecting to graph database running on " + Config.virtuosoHost + ":" + Config.virtuosoPort;
            Logger.log("error", msg);
            Logger.log("error", err);
            Logger.log("error", result);
        }
        else
        {
            const msg = "Connection to Virtuoso at " + Config.virtuosoHost + ":" + Config.virtuosoPort + " was established!";
            Logger.log("info", msg);
        }
        callback(err);
    });
};

DbConnection.prototype.close = function (callback)
{
    const self = this;

    const closePendingConnections = function (callback)
    {
        if (Object.keys(self.pendingRequests).length > 0)
        {
            Logger.log("Telling Virtuoso connection " + self.handle + " to abort all queued requests.");
            async.mapSeries(Object.keys(self.pendingRequests), function (queryID, cb)
            {
                if (self.pendingRequests.hasOwnProperty(queryID))
                {
                    if (!isNull(self.pendingRequests[queryID]) && typeof self.pendingRequests[queryID] === "function")
                    {
                        self.pendingRequests[queryID].cancel(cb);
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

                /* if(!isNull(self.pool))
                {
                    Logger.log("error","Killing all connections of user " + self.jdbc + " via JDBC");
                    self.executeViaJDBC("disconnect_user ('"+  self.username + "');", [], function(err, result){
                        Logger.log("error","Killing all connections of user " + self.jdbc + " via JDBC");
                        callback(err, result);
                    });
                } */
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

    const closeClientConnection = function (callback)
    {
        let fullUrl = "http://" + self.host;
        if (self.port)
        {
            fullUrl = fullUrl + ":" + self.port_isql;
        }

        rp({
            method: "POST",
            uri: fullUrl,
            form: {
                query: "disconnect_user ('" + Config.virtuosoAuth.username + "')"
            },
            json: true,
            forever: true
        })
            .then(function (err, parsedBody)
            {
                callback(err, parsedBody);
            });
    };

    const closeAllJDBCConnections = function (callback)
    {
        async.mapSeries(self.queue_jdbc, function (queryObject, callback)
        {
            if (!isNull(queryObject))
            {
                if (!isNull(queryObject.connection))
                {
                    queryObject.connection.release(callback);
                }
                else
                {
                    callback(null, null);
                }
            }
            else
            {
                callback(null, null);
            }
        }, function (err, results)
        {
            if (!isNull(self.pool))
            {
                self.pool.purge(function (err, result)
                {
                    delete self.pool;
                    callback(err, result);
                });
            }
            else
            {
                callback(null);
            }
        });
    };

    async.series([
        closeAllJDBCConnections,
        destroyQueues,
        closePendingConnections
    ], function (err, result)
    {
        callback(err, result);
    });
};

DbConnection.prototype.executeViaHTTP = function (queryStringWithArguments, argumentsArray, callback, resultsFormat, maxRows, loglevel)
{
    const self = this;

    queryObjectToString(queryStringWithArguments, argumentsArray, function (err, query)
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
                    query = "DEFINE sql:log-enable " + Config.virtuosoSQLLogLevel + "\n" + query;
                }

                self.queue_http.push({
                    queryStartTime: new Date(),
                    query: query,
                    callback,
                    callback,
                    query_id: uuid.v4(),
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
};

DbConnection.prototype.executeViaJDBC = function (queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, loglevel, runAsUpdate)
{
    const self = this;

    queryObjectToString(queryStringOrArray, argumentsArray, function (err, query)
    {
        if (isNull(err))
        {
            if (!isNull(self.pool))
            {
                // Add SPARQL keyword at the start of the query
                query = "SPARQL\n" + query;

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
                self.queue_jdbc.push({
                    queryStartTime: new Date(),
                    query: query,
                    query_id: uuid.v4(),
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
};

DbConnection.prototype.insertTriple = function (triple, graphUri, callback)
{
    const self = this;

    if (!triple.subject || !triple.predicate || !triple.object)
    {
        const error = "Attempted to insert an invalid triple, missing one of the three required elements ( subject-> " + triple.subject + " predicate ->" + triple.predicate + " object-> " + triple._object + " )";
        Logger.log("error", error);
        return callback(1, error);
    }
    if (triple.subject.substring(0, "\"".length) === "\"")
    {
    // http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
    // literals should not be subjects nor properties, even though it is allowed by the RDF spec.
        return callback(1, "Subjects should not be literals");
    }
    else if (triple.predicate.substring(0, "\"".length) === "\"")
    {
    // http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
    // literals should not be subjects, even though it is allowed by the RDF spec.
        return callback(1, "Predicates should not be literals");
    }
    let query = " WITH GRAPH <" + graphUri + ">" +
                " INSERT { " +
                "<" + triple.subject + "> " +
                "<" + triple.predicate + "> ";

    // we have an url (it is a resource and not a literal)
    if (triple.object.substring(0, "\"".length) === "\"")
    {
    // remove first and last " symbols, escape remaining special characters inside the text and re-add the "" for the query.

        let escapedObject = triple.object.substring(1);

        // remove language and last quotes
        escapedObject = escapedObject.substring(0, escapedObject.length - 4);

        // from http://stackoverflow.com/questions/7744912/making-a-javascript-string-sql-friendly
        function mySQLRealEscapeString (str)
        {
            return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char)
            {
                switch (char)
                {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                    return "\\\"";
                case "'":
                    return "\\'";
                case "\\":
                    break;
                default:
                    return char;
                }
            });
        }

        escapedObject = mySQLRealEscapeString(escapedObject);

        query = query +
                    "\"" +
                    escapedObject +
                    "\"";
    }
    else
    {
        query = query + "<" + triple.object + ">";
    }

    query = query + " }";

    const runQuery = function (callback)
    {
        self.executeViaJDBC(query,
            function (error, results)
            {
                if (isNull(error))
                {
                    return callback(null);
                }
                return callback(1, ("Error inserting triple " + triple.subject + " " + triple.predicate + " " + triple.object + "\n").substr(0, 200) + " . Server returned " + error);
            }
        );
    };

    if (Config.cache.active)
    {
        const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
        // Invalidate cache record for the updated resources
        Cache.getByGraphUri(graphUri).delete([triple.subject, triple.object], function (err, result)
        {
            if (isNull(err))
            {
                runQuery(callback);
            }
            else
            {
                callback(err, result);
            }
        });
    }
    else
    {
        runQuery(callback);
    }
};

DbConnection.prototype.deleteTriples = function (triples, graphName, callback)
{
    if (!isNull(triples) && triples instanceof Array && triples.length > 0)
    {
        const self = this;

        let triplesToDeleteString = "";
        let nullObjectCount = 0;
        let i;
        let argCount = 1;

        const queryArguments = [
            {
                type: Elements.types.resourceNoEscape,
                value: graphName
            }
        ];

        const urisToDelete = [];

        for (i = 0; i < triples.length; i++)
        {
            const triple = triples[i];

            if (Config.cache.active)
            {
                urisToDelete.push(triple.subject);
                urisToDelete.push(triple.object);
            }

            if (!isNull(triple.subject) && !isNull(triple.predicate))
            {
                // build the delete string
                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                queryArguments.push({
                    type: Elements.types.resource,
                    value: triple.subject
                });

                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                queryArguments.push({
                    type: Elements.types.resource,
                    value: triple.predicate
                });

                if (!isNull(triple.object))
                {
                    triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                    queryArguments.push({
                        type: triple.object.type,
                        value: triple.object.value
                    });
                }
                else
                {
                    triplesToDeleteString = triplesToDeleteString + " ?o" + nullObjectCount++ + " ";
                }
            }

            triplesToDeleteString = triplesToDeleteString + ".\n";
        }

        const query = "WITH [0] \n" +
            "DELETE { " +
            triplesToDeleteString + " \n" +
            "} \n" +
            " WHERE { " +
            triplesToDeleteString + " \n" +
            "}\n";

        const runQuery = function (callback)
        {
            self.executeViaJDBC(query, queryArguments, function (err, results)
            {
                /**
                 * Invalidate cached records because of the deletion
                 */

                if (Config.cache.active)
                {
                    return callback(err, results);
                }
                return callback(err, results);
            });
        };

        if (Config.cache.active)
        {
            let cache = Cache.getByGraphUri(graphName);
            cache.connection.delete(urisToDelete, function (err, result)
            {
                if (!isNull(err))
                {
                    Logger.log("debug", "Deleted cache records for triples " + JSON.stringify(triples) + ". Error Reported: " + result);
                }

                runQuery(callback);
            });
        }
        else
        {
            runQuery(callback);
        }
    }
    else
    {
        return callback(1, "Invalid or no triples sent for insertion / update");
    }
};

DbConnection.prototype.insertDescriptorsForSubject = function (subject, newDescriptorsOfSubject, graphName, callback)
{
    const self = this;

    if (!isNull(newDescriptorsOfSubject) && newDescriptorsOfSubject instanceof Object)
    {
        let insertString = "";
        let argCount = 1;

        const queryArguments = [
            {
                type: Elements.types.resourceNoEscape,
                value: graphName
            }
        ];

        for (let i = 0; i < newDescriptorsOfSubject.length; i++)
        {
            const newDescriptor = newDescriptorsOfSubject[i];
            let objects = newDescriptor.value;

            if (!(objects instanceof Array))
            {
                objects = [objects];
            }

            for (let j = 0; j < objects.length; j++)
            {
                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type: Elements.types.resource,
                    value: subject
                });

                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type: Elements.types.resource,
                    value: newDescriptor.uri
                });

                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type: newDescriptor.type,
                    value: objects[j]
                });

                insertString = insertString + ".\n";
            }
        }

        const query =
            "WITH GRAPH [0] \n" +
            "INSERT DATA\n" +
            "{ \n" +
            insertString + " \n" +
            "} \n";

        const runQuery = function (callback)
        {
            self.executeViaJDBC(query, queryArguments, function (err, results)
            {
                return callback(err, results);
            }, null, null, null, true);
        };

        if (Config.cache.active)
        {
            // Invalidate cache record for the updated resource
            const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
            // Invalidate cache record for the updated resources
            Cache.getByGraphUri(graphName).delete(subject, function (err, result)
            {
                runQuery(callback);
            });
        }
        else
        {
            runQuery(callback);
        }
    }
    else
    {
        return callback(1, "Invalid or no triples sent for insertion / update");
    }
};

DbConnection.prototype.deleteGraph = function (graphUri, callback)
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
        const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
        // Invalidate whole cache for this graph

        let graphCache;

        graphCache = Cache.getByGraphUri(graphUri);

        graphCache.deleteAll(function (err, result)
        {
            runQuery(callback);
        });
    }
    else
    {
        runQuery(callback);
    }
};

DbConnection.prototype.graphExists = function (graphUri, callback)
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
};

DbConnection.prototype.finishUpAndClose = function (callback)
{
    const self = this;
    self.close(function (err, result)
    {
        Logger.log("Virtuoso connections closed gracefully.");
        if (isNull(err))
        {
            callback(null, result);
        }
        else
        {
            callback(null, result);
        }
    });
};

module.exports.DbConnection = DbConnection;
