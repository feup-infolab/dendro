const util = require("util");
const async = require("async");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Queue = require("better-queue");
const rp = require("request-promise-native");
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

                                    const Ontology = rlequire("dendro", "src/models/meta/ontology.js").Ontology;
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
    const logParentFolder = rlequire.absPathInApp("dendro", "profiling");
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

DbConnection.prototype.reserveConnection = function (callback)
{
    const self = this;
    // Logger.log("debug", "Number of current connections to virtuoso: " + Object.keys(self.pool._pool).length);

    self.pool.reserve(function (err, connection)
    {
        if (isNull(err))
        {
            self.pendingRequests[connection.uuid] = true;
            callback(null, connection);
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

DbConnection.prototype.releaseConnection = function (connection, callback)
{
    const self = this;
    delete self.pendingRequests[connection.uuid];
    if (!isNull(self.pool))
    {
        let released = false;
        const timeout = setTimeout(function ()
        {
            if (!released)
            {
                const msg = "Unable to release connection in time, sending an error!!";
                Logger.log(msg);
                callback(1, msg);
            }
        }, self.timeout);

        self.pool.release(connection, function (err, result)
        {
            clearTimeout(timeout);
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

DbConnection.prototype.sendQueryViaJDBC = function (query, queryId, callback, runAsUpdate)
{
    const self = this;
    if (Config.debug.active && Config.debug.database.log_all_queries)
    {
        Logger.log("--EXECUTING QUERY (JDBC) : \n" + query);
    }

    const queryStartTime = new Date();

    const executeQueryOrUpdate = function (connection, callback)
    {
        const retryConnection = function (err, callback)
        {
            Logger.log("debug", "Retrying connection to virtuoso because of error: ");
            Logger.log("debug", JSON.stringify(err));
            const disconnectErrors = ["Virtuoso Communications Link Failure (timeout)", "Problem during closing : Broken pipe", "Problem during serialization : Broken pipe"];

            if (!isNull(err))
            {
                const stackText = err.stack;

                for (let i = 0; i < disconnectErrors.length; i++)
                {
                    let disconnectError = disconnectErrors[i];
                    if (stackText.indexOf(disconnectError) > -1)
                    {
                        self.tryToConnect(function (err)
                        {
                            callback(err);
                        });

                        return;
                    }
                }

                callback(err);
            }
            else
            {
                callback(err);
            }
        };

        const executeUpdateQuery = function (updateQuery, callback)
        {
            connection.conn.createStatement(function (err, statement)
            {
                if (isNull(err))
                {
                    statement.executeUpdate(updateQuery, function (err, results)
                    {
                        if (isNull(err))
                        {
                            if (Config.debug.active && Config.debug.database.log_all_queries)
                            {
                                Logger.log(JSON.stringify(results));
                            }

                            if (!isNull(err))
                            {
                                Logger.log("error", "Error Running Update Statement \n" + updateQuery);
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
                            statement.close(function (err)
                            {
                                if(!isNull(err))
                                {
                                    retryConnection(err, function (err)
                                    {
                                        if (isNull(err))
                                        {
                                            executeUpdateQuery(updateQuery, callback);
                                        }
                                        else
                                        {
                                            callback(err, "Connection to virtuoso was unable to be recovered after it was broken.");
                                        }
                                    });
                                }
                                else
                                {
                                    callback(err, results);
                                }
                            });
                        }
                    });
                }
                else
                {
                    callback(err, statement);
                }
            });
        };

        const executeSelectQuery = function (selectQuery, callback)
        {
            connection.conn.createStatement(function (err, statement)
            {
                if (isNull(err))
                {
                    statement.executeQuery(selectQuery, function (err, resultset)
                    {
                        if (isNull(err))
                        {
                            // Convert the result set to an object array.
                            resultset.toObjArray(function (err, results)
                            {
                                if (!isNull(err))
                                {
                                    Logger.log("error", "Error Running Query \n" + selectQuery);
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
                        else
                        {
                            statement.close(function (err)
                            {
                                retryConnection(err, function (err)
                                {
                                    if (isNull(err))
                                    {
                                        executeSelectQuery(selectQuery, callback);
                                    }
                                    else
                                    {
                                        callback(err, "Connection to virtuoso was unable to be recovered after it was broken.");
                                    }
                                });
                            });
                        }
                    });
                }
                else
                {
                    callback(err, statement);
                }
            });
        };

        // if (!isNull(Config.virtuosoSQLLogLevel))
        // {
        //     query = "log_enable(" + Config.virtuosoSQLLogLevel + "); \n" + query + "\n";
        // }
        // query = "set AUTOCOMMIT MANUAL;\n" + query + "\nCOMMIT WORK;\n set AUTOCOMMIT on;\n";

        if (!isNull(runAsUpdate))
        {
            executeUpdateQuery(query, callback);
        }
        else
        {
            executeSelectQuery(query, callback);
        }
    };

    self.reserveConnection(function (err, connection, queryID)
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
                self.releaseConnection(connection, function (err, result)
                {
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
            const msg = "Virtuoso did not close all connections in time!";
            Logger.log("error", msg);
            callback(1, msg);
        }
    }, Config.dbOperationTimeout * 10);

    async.mapSeries(Object.keys(Config.db), function (dbConfigKey, cb)
    {
        const dbConfig = Config.db[dbConfigKey];

        if (!isNull(dbConfig.connection) && dbConfig.connection instanceof DbConnection)
        {
            dbConfig.connection.close(function (err, result)
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
                rlequire.absPathInApp("dendro", "conf/virtuoso-jdbc/jdbc-4.2/virtjdbc4_2.jar")
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

        const timeoutSecs = 10;
        const config = {
            // Required
            url: `jdbc:virtuoso://${self.host}:${self.port_isql}/UID=${self.username}/PWD=${self.password}/PWDTYPE=cleartext/CHARSET=UTF-8/TIMEOUT=${timeoutSecs}`,
            drivername: "virtuoso.jdbc4.Driver",
            maxpoolsize: self.maxSimultaneousConnections,
            minpoolsize: Math.ceil(self.maxSimultaneousConnections / 2),
            // 600 seconds idle time (should be handled by the TIMEOUT setting, but we specify this to kill any dangling connections...
            maxidle: 1000 * timeoutSecs * 10,
            properties: {}
        };

        const pool = new Pool(config);

        pool.initialize(function (err, result)
        {
            if (err)
            {
                // Logger.log("error", "Error initializing Virtuoso connection pool: " + JSON.stringify(err));
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
                concurrent: self.maxSimultaneousConnections,
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

    if (isNull(DbConnection.connectionAttempts))
    {
        DbConnection.connectionAttempts = [];
    }

    DbConnection.connectionAttempts.push(callback);

    if (!DbConnection.connecting)
    {
        DbConnection.connecting = true;

        const tryToConnect = function (callback)
        {
            self.closeConnectionPool(function (err, result)
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
            });
        };

        // try calling apiMethod 10 times with linear backoff
        // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
        async.retry({
            times: 240,
            interval: function (retryCount)
            {
                const msecs = 500;
                Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to Virtuoso at " + Config.virtuosoHost + ":" + Config.virtuosoPort + "...");
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

            for (let i = 0; i < DbConnection.connectionAttempts.length; i++)
            {
                DbConnection.connectionAttempts[i](err, result);
            }

            DbConnection.connectionAttempts = [];

            DbConnection.connecting = false;
        });
    }
};

DbConnection.prototype.closeConnectionPool = function (callback)
{
    const self = this;
    if (self.pool)
    {
        async.map(self.pool._pool, function (connection, callback)
        {
            self.pool.release(connection, function (err, result)
            {
                callback(null);
            });
        }, function (err, results)
        {
            callback(err, results);
        });
    }
    else
    {
        callback(null);
    }
};

DbConnection.prototype.close = function (callback)
{
    // silvae86
    // THIS FUNCTION IS A CONSEQUENCE OF VIRTUOSO's QUALITY AND MY STUPIDITY
    // CONNECTIONS ARE NEVER CLOSED EVEN WITH PURGE METHOD!!!!
    const self = this;

    const closeConnectionPool = function (cb)
    {
        self.closeConnectionPool(cb);
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

    const closeClientConnection = function (callback)
    {
        // self.sendQueryViaJDBC(
        //     "disconnect_user ('" + Config.virtuosoAuth.username + "')",
        //     [],
        //     function (err, result)
        //     {
        //         if (!isNull(err))
        //         {
        //             Logger.log("error", "Error disconnecting user " + Config.virtuosoAuth.username + " before shutting down virtuoso.");
        //             Logger.log("error", err);
        //             Logger.log("error", result);
        //         }
        //         callback(err, result);
        //     }, null, null, null, true, true
        // );

        callback(null);
    };
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

                const uuid = require("uuid");
                const newQueryId = uuid.v4();
                self.queue_http.push({
                    queryStartTime: new Date(),
                    query: query,
                    callback,
                    callback,
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
};

DbConnection.prototype.executeViaJDBC = function (queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, loglevel, runAsUpdate, notSPARQL)
{
    const self = this;

    queryObjectToString(queryStringOrArray, argumentsArray, function (err, query)
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
                self.queue_jdbc.push({
                    queryStartTime: new Date(),
                    query: query,
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
        const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
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
            const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
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
        const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
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

module.exports.DbConnection = DbConnection;
