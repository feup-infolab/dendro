const path = require("path");
const Pathfinder = global.Pathfinder;

const util = require("util");
const async = require("async");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const uuid = require("uuid");
const jinst = require("jdbc/lib/jinst");
const Pool = require("jdbc/lib/pool");

const Queue = require('better-queue');

let profiling_logfile;
let boot_start_timestamp = new Date().toISOString();
const profiling_logfile_separator = "@";

function DbConnection (handle, host, port, port_isql, username, password, maxSimultaneousConnections, dbOperationsTimeout) {
    let self = this;

    if (!self.host || !self.port) {
        self.host = host;
        self.port = port;
        self.port_isql = port_isql;
        self.username = username;
        self.password = password;

        if(isNull(maxSimultaneousConnections))
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
}

const replaceArguments = function (query, argumentsArray, callback) {

    let queryString = "";

    const replaceArgumentsInQuery = function(queryString, queryArguments)
    {
        for (let i = 0; i < queryArguments.length; i++) {
            const currentArgumentIndex = "[" + i + "]";
            const currentArgument = queryArguments[i];

            //check for the presence of the parameter placeholder
            if (queryString.indexOf(currentArgumentIndex) !== -1) {
                try {
                    //will allow people to use the same parameter several times in the query,
                    // for example [0]....[0]...[0] by replacing all occurrences of [0] in the query string
                    const pattern = new RegExp("\\\[" + i + "\\\]", "g"); // [] are reserved chars in regex!

                    switch (currentArgument.type) {
                        case Elements.types.resourceNoEscape:
                            queryString = queryString.replace(pattern, "<" + currentArgument.value + ">");
                            break;
                        case Elements.types.resource:
                            queryString = queryString.replace(pattern, "<" + encodeURI(currentArgument.value) + ">");
                            break;
                        case Elements.types.property:
                            queryString = queryString.replace(pattern, "<" + encodeURI(currentArgument.value) + ">");
                            break;
                        case Elements.types.string:
                            queryString = queryString.replace(pattern, "\"" + encodeURIComponent(currentArgument.value) + "\"");
                            break;
                        case Elements.types.int:
                            queryString = queryString.replace(pattern, encodeURIComponent(currentArgument.value));
                            break;
                        case Elements.types.double:
                            queryString = queryString.replace(pattern, encodeURIComponent(currentArgument.value));
                            break;
                        case Elements.types.boolean:
                            let booleanForm;
                            try {
                                booleanForm = JSON.parse(currentArgument.value);
                                if (!(booleanForm === true || booleanForm === false)) {
                                    throw new Error();
                                }
                            }
                            catch (e) {
                                const msg = "Unable to convert argument [" + i + "]: It is set as a bolean, but the value is not true or false, it is : " + currentArgument.value;
                                console.error(msg);
                                return callback(1, msg);
                            }

                            queryString = queryString.replace(pattern, "\"" + encodeURIComponent(booleanForm.toString()) + "\"");

                            break;
                        case Elements.types.prefixedResource:
                            const validator = require('validator');
                            if (validator.isURL(currentArgument.value)) {
                                queryString = queryString.replace(pattern, "<" + currentArgument.value + ">");
                            }
                            else {
                                const Ontology = require('../../models/meta/ontology.js').Ontology;

                                if (!isNull(currentArgument.value)) {
                                    const indexOfColon = currentArgument.value.indexOf(":");
                                    const indexOfHash = currentArgument.value.indexOf("#");
                                    let indexOfSeparator;

                                    if(indexOfColon < 0 && indexOfHash > -1)
                                    {
                                        indexOfSeparator = indexOfHash;
                                    }
                                    else if(indexOfColon > -1 && indexOfHash < 0)
                                    {
                                        indexOfSeparator = indexOfColon;
                                    }

                                    if (indexOfSeparator > 0) {
                                        if (!isNull(currentArgument.value)) {
                                            const prefix = currentArgument.value.substr(0, indexOfSeparator);
                                            const element = currentArgument.value.substr(indexOfSeparator + 1);
                                            const ontology = Ontology.allOntologies[prefix].uri;
                                            const valueAsFullUri = ontology + element;

                                            queryString = queryString.replace(pattern, "<" + valueAsFullUri + ">");
                                        }
                                        else {
                                            const error = "Value of argument " + currentArgument.value + " is null. Query supplied was :\n " + query + " \n " + JSON.stringify(queryArguments);
                                            console.error(error);
                                            return callback(1, error);
                                        }
                                    }
                                    else {
                                        const error = "Value of argument " + currentArgument.value + " is not valid for an argument of type Prefixed Resource... Did you mean to parametrize it as a string type in the elements.js file?. Query supplied was : \n" + query + " \n " + JSON.stringify(queryArguments);
                                        console.error(error);
                                        return callback(1, error);
                                    }
                                }
                                else {
                                    const error = "Cannot Execute Query: Value of argument at index " + currentArgumentIndex + " is undefined. Query supplied was :\n " + query + " \n " + JSON.stringify(queryArguments);
                                    console.error(error);
                                    return callback(1, error);
                                }
                            }
                            break;
                        case Elements.types.date
                        :
                            queryString = queryString.replace(pattern, "\"" + currentArgument.value + "\"");
                            break;
                        case
                        Elements.types.long_string
                        :
                            queryString = queryString.replace(pattern, "'''" + encodeURIComponent(currentArgument.value) + "'''");
                            break;
                        case
                        Elements.types.stringNoEscape
                        :
                            queryString = queryString.replace(pattern, "\"" + currentArgument.value + "\"");
                            break;
                        default: {
                            const error = "Unknown argument type for argument in position " + i + " with value " + currentArgument.value + ". Query supplied was \n: " + query + " \n " + JSON.stringify(queryArguments);
                            console.error(error);
                            return callback(1, error);
                        }
                    }
                }
                catch (e) {
                    console.error("Error processing argument " + currentArgumentIndex + " in query: \n----------------------\n\n" + queryString + "\n----------------------");
                    console.error("Value of Argument " + currentArgumentIndex + ": " + currentArgument.value);
                    console.error(e.stack);
                    throw e;
                }
            }
            else {
                const error = "Error in query " + query + "; Unable to find argument with index " + i + " .";
                console.error(error);
                return callback(1, error);
            }
        }
        return queryString;
    };

    if(query instanceof Array)
    {
        for(let i = 0; i < query.length; i++)
        {
            queryString = "SPARQL\n";
            queryString += query[i];
        }

        queryString = replaceArgumentsInQuery(queryString, argumentsArray);

        return callback(null, queryString);
    }
    else if(typeof query === "string")
    {
        queryString =
            "SPARQL\n" +
            query;

        replaceArgumentsInQuery(queryString, argumentsArray);
    }

    return callback(null, queryString);
};

DbConnection.addLimitsClauses = function(query, offset, maxResults) {
    if(!isNull(offset) &&
        typeof offset === "number" &&
        offset > 0)
    {
        query = query + " OFFSET " + offset + "\n";
    }

    if(!isNull(maxResults) &&
        typeof maxResults === "number" &&
        maxResults > 0)
    {
        query = query + " LIMIT "+ maxResults + " \n";
    }

    return query;
};

DbConnection.pushLimitsArguments = function(unpaginatedArgumentsArray, maxResults, offset) {
    if(
        !isNull(offset) &&
        typeof offset === "number" &&
        offset > 0 &&
        !isNaN(offset)
    )
    {
        unpaginatedArgumentsArray.push({
            type : Elements.types.int,
            value : offset
        });
    }

    if(
        !isNull(maxResults) &&
        typeof maxResults === "number" &&
        maxResults > 0 &&
        !isNaN(maxResults)
    )
    {
        unpaginatedArgumentsArray.push({
            type : Elements.types.int,
            value : maxResults
        });
    }

    return unpaginatedArgumentsArray;
};

DbConnection.paginate = function(req, viewVars) {
    if(!isNull(req) && !isNull(req.query))
    {
        if(!req.query.currentPage)
        {
            viewVars.currentPage = 0;
        }
        else
        {
            viewVars.currentPage = parseInt(req.query.currentPage);           //avoid injections
        }

        if(!req.query.pageSize)
        {
            viewVars.pageSize = 20;
        }
        else
        {
            viewVars.pageSize = parseInt(req.query.pageSize);              //avoid injections
        }
    }

    return viewVars;
};

DbConnection.paginateQuery = function (req, query) {
    if(!isNull(req) && !isNull(req.query))
    {
        if(isNull(req.query.currentPage))
        {
            req.query.currentPage = 0;
        }
        else
        {
            req.query.currentPage = parseInt(req.query.currentPage);           //avoid injections
        }

        if(!req.query.pageSize)
        {
            req.query.pageSize = 20;
        }
        else
        {
            req.query.pageSize = parseInt(req.query.pageSize);              //avoid injections
        }

        const skip = req.query.pageSize * req.query.currentPage;

        if(req.query.pageSize > 0)
        {
            query = query + " LIMIT " + req.query.pageSize;
        }

        if(skip > 0)
        {
            query = query + " OFFSET " + skip;
        }
    }

    return query;
};

DbConnection.buildFromStringAndArgumentsArrayForOntologies = function(ontologyURIsArray, startingArgumentCount) {
    let i;
    let fromString = "";
    const argumentsArray = [];

    for(i = 0; i < ontologyURIsArray.length; i++)
    {
        const argIndex = i + startingArgumentCount; //arguments array starts with 2 fixed elements

        fromString = fromString + " FROM [" + argIndex +"] \n";

        argumentsArray.push(
            {
                type : Elements.types.resourceNoEscape,
                value : ontologyURIsArray[i]
            }
        );
    }

    return {
        fromString : fromString,
        argumentsArray : argumentsArray
    };
};

DbConnection.buildFilterStringForOntologies = function(ontologyURIsArray, filteredVariableName) {
    let filterString = "";

    if(!isNull(ontologyURIsArray) && ontologyURIsArray instanceof Array)
    {
        if(ontologyURIsArray.length > 0)
        {
            filterString = filterString + "FILTER( ";

            for(let i = 0; i < ontologyURIsArray.length; i++)
            {
                const ontologyUri = ontologyURIsArray[i];
                filterString = filterString + " STRSTARTS(STR(?"+filteredVariableName+"), \""+ontologyUri + "\") ";

                if(i < ontologyURIsArray.length - 1)
                {
                    filterString = filterString + " || ";
                }
            }

            filterString = filterString + ") .";
        }
    }

    return filterString;
};

DbConnection.prototype.create = function(callback) {
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    const self = this;

    const checkDatabaseConnection = function(callback)
    {
        if (!jinst.isJvmCreated()) {
            jinst.addOption("-Xrs");
            jinst.setupClasspath([
                Pathfinder.absPathInApp("conf/virtuoso-jdbc/virtjdbc4_2.jar")
            ]);
        }

        const config = {
            // Required
            url : "jdbc:virtuoso://"+self.host+":"+self.port_isql+"/UID="+self.username+"/PWD="+self.password+"/PWDTYPE=cleartext",
            drivername: 'virtuoso.jdbc4.Driver',
            minpoolsize: 1,
            maxpoolsize: self.maxSimultaneousConnections,

            properties: {}
        };

        const pool = new Pool(config);

        pool.initialize(function(err, result) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, result);
            }
            else
            {
                self.pool = pool;
                callback(null, self);
            }
        });
    };

    async.series([
            checkDatabaseConnection,
    ], function(err){
        if(isNull(err))
        {
            callback(err, self);
        }
        else
        {
            callback(err, null);
        }
    });
};

DbConnection.prototype.close = function(callback){
    const self = this;
    console.log("[INFO] Telling JDBC Virtuoso connection" + self.handle + " to close when all requests are completed.");

    const destroyQueue = function(callback)
    {
        self.q.destroy(callback);
    };
    
    async.series([
        destroyQueue
    ], function(err, result){
        callback(err, result);
    })

};

DbConnection.prototype._execute = function(queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, isQuery) {
    const self = this;

    const runQuery = function(queryObject)
    {
        if (Config.debug.active && Config.debug.database.log_all_queries)
        {
            console.log("--EXECUTING QUERY (JDBC) : \n" + queryObject.query);
        }

        const reserveConnection = function(callback)
        {
            self.pool.reserve(function(err, connection) {
                if(isNull(err))
                {
                    self.pendingRequests[queryObject.query_id] = queryObject.connection = connection;
                    callback(null, connection);
                }
                else
                {
                    callback(err, result);
                }
            })
        };

        const releaseConnection = function(queryObject, callback)
        {
            self.pool.release(queryObject.connection, function(err, connection){
                if(isNull(err))
                {
                    delete self.pendingRequests[queryObject.query_id];
                    delete self.pendingRequests[queryObject.query_id];
                    callback(err);
                }
                else
                {
                    console.error("Error releasing JDBC connection on pool of database " + self.id);
                    console.error(JSON.stringify(err));
                    console.error(JSON.stringify(connection));
                    callback(err, connection);
                }
            });
        };

        const finishQuery = function(queryObject)
        {
            if(Config.debug.database.log_query_times)
            {
                const msec = new Date().getTime() - queryObject.queryStartTime.getTime();
                const fs = require("fs");
                const path = require("path");
                const mkdirp = require("mkdirp");
                const logParentFolder = Pathfinder.absPathInApp("profiling");
                const queryProfileLogFilePath = path.join(logParentFolder, "database_profiling_" + boot_start_timestamp + ".csv");
                let queryProfileLogFileDescriptor;

                if(!self.created_profiling_logfile && !fs.existsSync(queryProfileLogFilePath))
                {
                    mkdirp.sync(logParentFolder);
                    queryProfileLogFileDescriptor = fs.openSync(queryProfileLogFilePath, 'w'); //truncate / create blank file
                    fs.appendFileSync(queryProfileLogFilePath, "query" + profiling_logfile_separator + "time_msecs\n");
                    self.created_profiling_logfile = true;
                }

                fs.appendFileSync(queryProfileLogFilePath, queryObject.query.replace(/(?:\r\n|\r|\n)/g,"") + profiling_logfile_separator + msec + "\n");

                if(!self.closed_profiling_logfile)
                {
                    try{
                        fs.closeSync(queryProfileLogFileDescriptor);
                    }
                    catch(e)
                    {}

                    self.closed_profiling_logfile = true;
                }
            }

            releaseConnection(queryObject, function(err, result){
                queryObject.callback(err, queryObject.result);
            });
        };

        const executeQueryOrStatement = function(callback)
        {
            queryObject.connection.conn.createStatement(function(err, statement) {
                if (isNull(err))
                {
                    //difference between query and procedure (does not return anything. needed for deletes and inserts)
                    if(queryObject.isQuery)
                    {
                        statement.executeQuery(queryObject.query, function(err, resultset) {
                            if (err) {
                                callback(err)
                            } else {
                                // Convert the result set to an object array.
                                resultset.toObjArray(function(err, results) {
                                    if(!isNull(err))
                                    {
                                        console.error(JSON.stringify(err));
                                        console.error(JSON.stringify(results));
                                    }
                                    
                                    queryObject.result = results;
                                    callback(err, results);
                                });
                            }
                        });
                    }
                    else
                    {
                        statement.executeUpdate(queryObject.query, function(err, results) {
                            if(!isNull(err))
                            {
                                console.error("Error Running Query \n" + queryObject.query);
                                console.error(JSON.stringify(err));
                                console.error(JSON.stringify(results));
                            }

                            queryObject.result = results;
                            callback(err, results);
                        });
                    }
                }
                else
                {
                    callback(err);
                }
            });
        };

        reserveConnection(function(err, connection){
            if(isNull(err))
            {
                executeQueryOrStatement(function(err, results){
                    if(!isNull(err))
                    {
                        console.error("########################   Error executing query ########################   \n" + queryObject.query + "\n########################   Via JDBC ON Virtuoso   ########################   ");
                        console.error(JSON.stringify(err))
                        console.error(JSON.stringify(results))
                    }

                    finishQuery(queryObject);
                });
            }
            else
            {
                const msg = "Error occurred while reserving connection from JDBC connection pool of database " + self.id;
                console.error(JSON.stringify(err));
                console.error(JSON.stringify(connection));
                console.error(msg);
                callback(err, msg);
            }
        });
    }

    replaceArguments(queryStringOrArray, argumentsArray, function(err, query){
        if (isNull(err))
        {
            if (!isNull(self.pool))
            {
                runQuery({
                    queryStartTime : new Date(),
                    query : query,
                    query_id : uuid.v4(),
                    isQuery : isQuery,
                    callback, function(err, results)
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
            console.error(msg);
            return callback(1, msg);
        }
    });
};

DbConnection.prototype.executeQuery = function(queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows) {
    const self = this;
    self._execute(queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, true);
};

DbConnection.prototype.executeStatement = function(queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows) {
    const self = this;
    self._execute(queryStringOrArray, argumentsArray, callback, resultsFormat, maxRows, false);
};

DbConnection.prototype.insertTriple = function (triple, graphUri, callback) {
    const self = this;

    if(!triple.subject  || !triple.predicate || !triple.object)
    {
        const error =  "Attempted to insert an invalid triple, missing one of the three required elements ( subject-> " + triple.subject + " predicate ->" + triple.predicate + " object-> " + triple._object +" )";
        console.error(error);
        return callback(1, error);
    }
    else
    {
        if(triple.subject.substring(0, "\"".length) === "\"")
        {
            //http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
            //literals should not be subjects nor properties, even though it is allowed by the RDF spec.
            return callback(1, "Subjects should not be literals");
        }
        else if(triple.predicate.substring(0, "\"".length) === "\"")
        {
            //http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
            //literals should not be subjects, even though it is allowed by the RDF spec.
            return callback(1, "Predicates should not be literals");
        }
        else
        {
            let query = " WITH GRAPH <" + graphUri + ">" +
                " INSERT { " +
                "<" + triple.subject + "> " +
                "<" + triple.predicate + "> ";

            //we have an url (it is a resource and not a literal)
            if(triple.object.substring(0, "\"".length) === "\"")
            {
                //remove first and last " symbols, escape remaining special characters inside the text and re-add the "" for the query.

                let escapedObject = triple.object.substring(1);
                escapedObject = escapedObject.substring(0, escapedObject.length - 4); //remove language and last quotes

                //from http://stackoverflow.com/questions/7744912/making-a-javascript-string-sql-friendly
                function mysql_real_escape_string (str) {
                    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
                        switch (char) {
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
                                return "\\\'";
                            case "\\":
//                            case "%":
//                                return "\\"+char; // prepends a backslash to backslash, percent,
//                            // and double/single quotes
                        }
                    });
                }

                escapedObject = mysql_real_escape_string(escapedObject);

                query = query +
                    "\"" +
                    escapedObject
                    + "\"";
            }
            else
            {
                query = query + "<" + triple.object + ">";
            }

            query = query + " }";

            const runQuery = function(callback)
            {
                self.executeStatement(query,
                        function(error, results)
                        {
                            if(isNull(error))
                            {
                                return callback(null);
                            }
                            else
                            {
                                return callback(1, ("Error inserting triple " + triple.subject + " " + triple.predicate + " "  + triple.object +"\n").substr(0,200) +" . Server returned " + error);
                            }
                        }
                );
            }

            if(Config.cache.active)
            {
                const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
                //Invalidate cache record for the updated resources
                Cache.getByGraphUri(graphUri).delete([triple.subject, triple.object], function(err, result){
                    runQuery(callback);
                });
            }
            else
            {
                runQuery(callback);
            }
        }
    }
};

DbConnection.prototype.deleteTriples = function(triples, graphName, callback) {
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

    if(!isNull(triples) && triples instanceof Array && triples.length > 0)
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

        for(i=0; i < triples.length ; i++)
        {
            const triple = triples[i];

            if(Config.cache.active)
            {
                urisToDelete.push(triple.subject);
                urisToDelete.push(triple.object);
            }

            if(!isNull(triple.subject) && !isNull(triple.predicate))
            {
                //build the delete string
                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                queryArguments.push({
                    type : Elements.types.resource,
                    value : triple.subject
                });


                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                queryArguments.push({
                    type : Elements.types.resource,
                    value : triple.predicate
                });

                if(!isNull(triple.object))
                {
                    triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                    queryArguments.push({
                        type : triple.object.type,
                        value : triple.object.value
                    });
                }
                else
                {
                    triplesToDeleteString = triplesToDeleteString + " ?o"+ nullObjectCount++ + " ";
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

        const runQuery = function(callback)
        {
            self.executeStatement(query, queryArguments, function(err, results)
            {
                /**
                 * Invalidate cached records because of the deletion
                 */

                if(Config.cache.active)
                {
                    return callback(err, results);
                }
                else
                {
                    return callback(err, results);
                }
            });
        };

        if(Config.cache.active)
        {
            let cache = Cache.getByGraphUri(graphName);
            cache.connection.delete(urisToDelete, function(err, result)
            {
                if (!isNull(err))
                {
                    console.log("[DEBUG] Deleted cache records for triples " + JSON.stringify(triples) + ". Error Reported: " + result);
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

DbConnection.prototype.insertDescriptorsForSubject = function(subject, newDescriptorsOfSubject, graphName, callback) {
    const self = this;

    if(!isNull(newDescriptorsOfSubject) && newDescriptorsOfSubject instanceof Object)
    {
        let insertString = "";
        let argCount = 1;

        const queryArguments = [
            {
                type: Elements.types.resourceNoEscape,
                value: graphName
            }
        ];

        for(let i = 0; i < newDescriptorsOfSubject.length; i++)
        {
            const newDescriptor = newDescriptorsOfSubject[i];
            let objects = newDescriptor.value;

            if(!(objects instanceof Array))
            {
                objects = [objects];
            }
            else
            {
                objects = objects;
            }

            for(let j = 0; j < objects.length ; j++)
            {
                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type : Elements.types.resource,
                    value : subject
                });

                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type : Elements.types.resource,
                    value : newDescriptor.uri
                });

                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type : newDescriptor.type,
                    value : objects[j]
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

        const runQuery = function(callback)
        {
            self.executeStatement(query, queryArguments, function(err, results)
            {
                return callback(err, results);
            });
        };

        if(Config.cache.active)
        {
            //Invalidate cache record for the updated resource
            const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
            //Invalidate cache record for the updated resources
            Cache.getByGraphUri(graphName).delete(subject, function(err, result){
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

DbConnection.prototype.deleteGraph = function(graphUri, callback) {
    const self = this;

    const runQuery = function(callback)
    {
        self.executeStatement("CLEAR GRAPH <"+graphUri+">",
            [],
            function(err, resultsOrErrMessage)
            {
                return callback(err, resultsOrErrMessage);
            }
        );
    };

    if(Config.cache.active)
    {
        //Invalidate cache record for the updated resource
        const Cache = require(Pathfinder.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
        //Invalidate whole cache for this graph

        let graphCache;
        try{
            graphCache = Cache.getByGraphUri(graphUri);
            graphCache.deleteByQuery({}, function(err, result){
                runQuery(callback);
            });
        }
        catch(e)
        {
            runQuery(callback);
        }
    }
    else
    {
        runQuery(callback);
    }
};

DbConnection.prototype.graphExists = function(graphUri, callback) {
    const self = this;

    self.executeQuery("ASK { GRAPH [0] { ?s ?p ?o . } }",
        [
            {
                type : Elements.types.resourceNoEscape,
                value : graphUri
            }
        ],
        function(err, result)
        {
            if(isNull(err))
            {
                if(result === true)
                {
                    return callback(err, true);
                }
                else
                {
                    return callback(err, false);
                }
            }
            else
            {
                return callback(err, null);
            }
        }
    );
};

module.exports.DbConnection = DbConnection ;
