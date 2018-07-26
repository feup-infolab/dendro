const util = require("util");
const async = require("async");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

const rlequire = require("rlequire");
const _ = require("underscore");
const validator = require("validator");
const SparqlParser = require("sparqljs").Parser;
const parser = new SparqlParser();
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

class DbConnection
{
    constructor (options)
    {
        let self = this;
        const handle = options.handle;
        const host = options.host;
        const port = options.port;
        const username = options.username;
        const password = options.password;
        const maxSimultaneousConnections = options.maxSimultaneousConnections;
        const dbOperationsTimeout = options.dbOperationsTimeout;

        if (isNull(maxSimultaneousConnections))
        {
            self.maxSimultaneousConnections = 1;
        }
        else
        {
            self.maxSimultaneousConnections = maxSimultaneousConnections;
        }

        self.host = host;
        self.port = port;
        self.username = username;
        self.password = password;

        self.handle = handle;
        self.dbOperationTimeout = dbOperationsTimeout;
        self.pendingRequests = {};
        self.databaseName = "graph";
        self.created_profiling_logfile = false;
    }

    static getPrefixTrain ()
    {
        // Parse a SPARQL query to a JSON object
        // const parsedQuery = parser.parse(query);

        if (isNull(DbConnection.prefixTrain))
        {
            DbConnection.prefixTrain =
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n";

            _.map(Config.enabledOntologies, function (ontology)
            {
                DbConnection.prefixTrain += `PREFIX ${ontology.prefix}: <${ontology.uri}>\n`;
            });
        }

        return DbConnection.prefixTrain;
    }

    static queryObjectToString (query, argumentsArray, callback)
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
                    const findAllQuotationMarksRegex = new RegExp("'", "g");
                    let booleanForm;
                    let stringWithEscapedQuotationMarks;

                    let indexOfColon;
                    let indexOfHash;
                    let indexOfSeparator;

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
                        stringWithEscapedQuotationMarks = currentArgument.value.replace(findAllQuotationMarksRegex, "\\'");
                        transformedQuery = transformedQuery.replace(pattern, "'''" + stringWithEscapedQuotationMarks + "'''");
                        break;
                    case Elements.types.int:
                        transformedQuery = transformedQuery.replace(pattern, currentArgument.value);
                        break;
                    case Elements.types.double:
                        transformedQuery = transformedQuery.replace(pattern, currentArgument.value);
                        break;
                    case Elements.types.boolean:
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
                        if (validator.isURL(currentArgument.value))
                        {
                            transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                        }
                        else
                        {
                            if (!isNull(currentArgument.value))
                            {
                                indexOfColon = currentArgument.value.indexOf(":");
                                indexOfHash = currentArgument.value.indexOf("#");

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
    }

    static recordQueryConclusionInLog (query, queryStartTime)
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
    }

    static finishUpAllConnectionsAndClose (callback)
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
    }

    static addLimitsClauses (query, offset, maxResults)
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
    }

    static pushLimitsArguments (unpaginatedArgumentsArray, maxResults, offset)
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
    }

    static paginate (req, viewVars)
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
    }

    static paginateQuery (req, query)
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
    }

    static buildFromStringAndArgumentsArrayForOntologies (ontologyURIsArray, startingArgumentCount)
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
    }

    static buildFilterStringForOntologies (ontologyURIsArray, filteredVariableName)
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
    }

    static mySQLRealEscapeString (str)
    {
        // from http://stackoverflow.com/questions/7744912/making-a-javascript-string-sql-friendly
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

    sendQueryViaJDBC (query, queryId, callback, runAsUpdate)
    {
        throw new Error("This can only be called from subclasses!");
    }

    create (callback)
    {
        throw new Error("This can only be called from subclasses!");
    }

    tryToConnect (callback)
    {
        throw new Error("This can only be called from subclasses!");
    }

    close (callback)
    {
        throw new Error("This can only be called from subclasses!");
    }

    execute (queryStringWithArguments, argumentsArray, callback, options)
    {
        throw new Error("This can only be called from subclasses!");
    }

    insertTriple (triple, graphUri, callback)
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

            escapedObject = DbConnection.mySQLRealEscapeString(escapedObject);

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
            self.execute(query,
                function (error, results)
                {
                    if (isNull(error))
                    {
                        return callback(null);
                    }
                    return callback(1, ("Error inserting triple " + triple.subject + " " + triple.predicate + " " + triple.object + "\n").substr(0, 200) + " . Server returned " + error);
                }
            ), {
                runAsUpdate: true
            };
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
    }

    deleteTriples (triples, graphName, callback)
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
                self.execute(query, queryArguments, function (err, results)
                {
                /**
                 * Invalidate cached records because of the deletion
                 */

                    if (Config.cache.active)
                    {
                        return callback(err, results);
                    }
                    return callback(err, results);
                },
                {
                    runAsUpdate: true
                });
            };

            if (Config.cache.active)
            {
                const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
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
    }

    insertDescriptorsForSubject (subject, newDescriptorsOfSubject, graphName, callback)
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
                self.execute(query, queryArguments, function (err, results)
                {
                    return callback(err, results);
                }, {
                    runAsUpdate: true
                });
            };

            if (Config.cache.active)
            {
            // Invalidate cache record for the updated resource
                const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
                // Invalidate cache record for the updated resources
                Cache.getByGraphUri(graphName).delete(subject, function (err, result)
                {
                    if (err)
                    {
                        Logger.log("debug", "Exception deleting cache record for " + subject + ".");
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
        else
        {
            return callback(1, "Invalid or no triples sent for insertion / update");
        }
    }

    deleteGraph (graphUri, callback)
    {
        throw new Error("This can only be called from subclasses!");
    }

    graphExists (graphUri, callback)
    {
        throw new Error("This can only be called from subclasses!");
    }
}

module.exports.DbConnection = DbConnection;
