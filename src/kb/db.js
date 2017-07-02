const util = require('util');
const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const uuid = require('uuid');
let queue = require('queue');

function DbConnection (host, port, username, password, maxSimultaneousConnections)
{
    let self = this;

    if (!self.host || !self.port) {
        self.host = host;
        self.port = port;
        self.username = username;
        self.password = password;

        if(isNull(self.maxSimultaneousConnections))
        {
            self.maxSimultaneousConnections = 50;
        }
        else
        {
            self.maxSimultaneousConnections = maxSimultaneousConnections;
        }
    }

    self.databaseName = "graph";
}

//register argument types for queries

DbConnection.resourceNoEscape = 0;
DbConnection.resource = 1;
DbConnection.property = 2;

DbConnection.string = 3;
DbConnection.int = 4;
DbConnection.double = 5;
DbConnection.boolean = 6;
DbConnection.prefixedResource = 7; //for "dcterms:creator", "nie:isLogicalPartOf" and other prefixed resources
DbConnection.date = 8;
DbConnection.long_string = 9;
DbConnection.stringNoEscape = 10;

DbConnection.prototype.create = function(callback) {
    const self = this;
    const xmlHttp = new XMLHttpRequest();

    // prepare callback
    xmlHttp.onreadystatechange = function() {
        if(xmlHttp.readyState === 4)
        {
            if(xmlHttp.status === 200)
            {
                self.q = queue();
                self.q.timeout = Config.dbOperationTimeout;

                if(Config.debug.database.log_query_timeouts) {
                    self.q.on('timeout', function (next, job) {
                        console.log('query timed out:', job.toString().replace(/\n/g, ''));
                        next();
                    });
                }

                self.q.on('success', function(result, job) {
                    //console.log('query finished processing:', job.toString().replace(/\n/g, ''));
                });

                return callback(self);
            }
            else
            {
                return callback(false);
            }
        }
    };

    let fullUrl = "http://" + self.host;

    if (self.port) {
        fullUrl = fullUrl + ":" + self.port;
    }

    xmlHttp.open("GET", fullUrl, true);
    xmlHttp.send(null);
};


const queryObjectToString = function (query, argumentsArray, callback) {
    let transformedQuery = query;

    for (let i = 0; i < argumentsArray.length; i++) {
        const currentArgumentIndex = "[" + i + "]";
        const currentArgument = argumentsArray[i];

        //check for the presence of the parameter placeholder
        if (transformedQuery.indexOf(currentArgumentIndex) !== -1) {
            try {

                //will allow people to use the same parameter several times in the query,
                // for example [0]....[0]...[0] by replacing all occurrences of [0] in the query string
                const pattern = new RegExp("\\\[" + i + "\\\]", "g"); // [] are reserved chars in regex!

                switch (currentArgument.type) {
                    case DbConnection.resourceNoEscape:
                        transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                        break;
                    case DbConnection.resource:
                        transformedQuery = transformedQuery.replace(pattern, "<" + encodeURI(currentArgument.value) + ">");
                        break;
                    case DbConnection.property:
                        transformedQuery = transformedQuery.replace(pattern, "<" + encodeURI(currentArgument.value) + ">");
                        break;
                    case DbConnection.string:
                        transformedQuery = transformedQuery.replace(pattern, "\"" + encodeURIComponent(currentArgument.value) + "\"");
                        break;
                    case DbConnection.int:
                        transformedQuery = transformedQuery.replace(pattern, encodeURIComponent(currentArgument.value));
                        break;
                    case DbConnection.double:
                        transformedQuery = transformedQuery.replace(pattern, encodeURIComponent(currentArgument.value));
                        break;
                    case DbConnection.boolean:
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

                        transformedQuery = transformedQuery.replace(pattern, "\"" + encodeURIComponent(booleanForm.toString()) + "\"");

                        break;
                    case DbConnection.prefixedResource:
                        const validator = require('validator');
                        if (validator.isURL(currentArgument.value)) {
                            transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                        }
                        else {
                            const Ontology = require('../models/meta/ontology.js').Ontology;

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

                                        transformedQuery = transformedQuery.replace(pattern, "<" + valueAsFullUri + ">");
                                    }
                                    else {
                                        const error = "Value of argument " + currentArgument.value + " is null. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                                        console.error(error);
                                        return callback(1, error);
                                    }
                                }
                                else {
                                    const error = "Value of argument " + currentArgument.value + " is not valid for an argument of type Prefixed Resource... Did you mean to parametrize it as a string type in the elements.js file?. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                                    console.error(error);
                                    return callback(1, error);
                                }
                            }
                            else {
                                const error = "Cannot Execute Query: Value of argument at index " + currentArgumentIndex + " is undefined. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                                console.error(error);
                                return callback(1, error);
                            }
                        }
                        break;
                    case DbConnection.date
                    :
                        transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                        break;
                    case
                    DbConnection.long_string
                    :
                        transformedQuery = transformedQuery.replace(pattern, "'''" + encodeURIComponent(currentArgument.value) + "'''");
                        break;
                    case
                    DbConnection.stringNoEscape
                    :
                        transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                        break;
                    default: {
                        const error = "Unknown argument type for argument in position " + i + " with value " + currentArgument.value + ". Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                        console.error(error);
                        return callback(1, error);
                    }
                }
            }
            catch (e) {
                console.error("Error processing argument " + currentArgumentIndex + " in query: \n----------------------\n\n" + transformedQuery + "\n----------------------");
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

    return callback(null, transformedQuery);
};

DbConnection.prototype.execute = function(queryStringWithArguments, argumentsArray, callback, resultsFormat, maxRows) {

    const self = this;

    queryObjectToString(queryStringWithArguments, argumentsArray, function(err, query){
        if (!err)
        {
            if (self.host && self.port)
            {
                if (isNull(resultsFormat)) //by default, query format will be json
                {
                    resultsFormat = "application/json";
                }

                if (isNull(maxRows)) //by default, query format will be json
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

                query = "DEFINE sql:log-enable 3\n" + query;

                const options = {
                    method: 'POST',
                    uri: fullUrl,
                    form: {
                        query: query,
                        maxrows: maxRows,
                        format: resultsFormat,
                        open_timeout: Config.dbOperationTimeout
                    },
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    json: true
                };

                self.q.push(function(cb){

                    if (Config.debug.active && Config.debug.database.log_all_queries)
                    {
                        console.log("POSTING QUERY: \n" + query);
                    }

                    let rp = require('request-promise');
                    rp(options)
                        .then(function (parsedBody) {
                            const transformedResults = [];
                            // iterate through all the rows in the result list

                            if (!isNull(parsedBody.boolean))
                            {
                                cb();
                                callback(null, parsedBody.boolean);
                            }
                            else
                            {
                                const rows = parsedBody.results.bindings;
                                const numberOfRows = rows.length;

                                if (numberOfRows === 0)
                                {
                                    cb();
                                    return callback(null, []);
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
                                                            transformedResults[i][cellHeader] = decodeURI(value);
                                                            break;
                                                        }
                                                        // default is a string value
                                                        default:
                                                        {
                                                            const valueWithQuotes = decodeURIComponent(value).replace(/\"/g, "\\\"");
                                                            transformedResults[i][cellHeader] = valueWithQuotes;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    callback(null, transformedResults);
                                    cb();
                                }
                            }
                        })
                        .catch(function(err){
                            const error = "Virtuoso server returned error: \n " + util.inspect(err);
                            console.trace(err);
                            cb();
                            return callback(1, err);
                        });
                });

                self.q.start();
            }
            else
            {
                return callback(1, "Database connection must be set first");
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

DbConnection.addLimitsClauses = function(query, offset, maxResults)
{
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

DbConnection.pushLimitsArguments = function(unpaginatedArgumentsArray, maxResults, offset)
{
    if(!isNull(offset) &&
        typeof offset === "number" &&
        offset > 0)
    {
        unpaginatedArgumentsArray = unpaginatedArgumentsArray.push({
            type : DbConnection.int,
            value : maxResults
        });
    }

    if(!isNull(maxResults) &&
        typeof maxResults === "number" &&
        maxResults > 0)
    {
        unpaginatedArgumentsArray = unpaginatedArgumentsArray.push({
            type : DbConnection.int,
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

DbConnection.prototype.insertTriple = function (triple, graphUri, callback)
{
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

            //console.log("Running insert query : " + query);

            const Cache = require(Config.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
            //Invalidate cache record for the updated resources
            Cache.get().delete([triple.subject, triple.object], function(err, result){});

            self.execute(query,
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
    }
};

DbConnection.prototype.deleteTriples = function(triples, graphName, callback)
{
    if(!isNull(triples) && triples instanceof Array && triples.length > 0)
    {
        const self = this;

        let triplesToDeleteString = "";
        let nullObjectCount = 0;
        let i;
        let argCount = 1;

        const queryArguments = [
            {
                type: DbConnection.resourceNoEscape,
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
                    type : DbConnection.resource,
                    value : triple.subject
                });


                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                queryArguments.push({
                    type : DbConnection.resource,
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

        /**
         * Invalidate cached records because of the deletion
         */
        if(Config.cache.active)
        {
            let cache = global.redis.default;
            cache.connection.delete(urisToDelete, function(err, result)
            {
                if (!isNull(err))
                {
                    console.log("[DEBUG] Deleted cache records for triples " + JSON.stringify(triples) + ". Error Reported: " + result);
                }
            });
        }

        self.execute(query, queryArguments, function(err, results)
        {
            return callback(err, results);
        });
    }
    else
    {
        return callback(1, "Invalid or no triples sent for insertion / update");
    }
};

DbConnection.prototype.insertDescriptorsForSubject = function(subject, newDescriptorsOfSubject, graphName, callback)
{
    const self = this;

    if(!isNull(newDescriptorsOfSubject) && newDescriptorsOfSubject instanceof Object)
    {
        let insertString = "";
        let argCount = 1;

        const queryArguments = [
            {
                type: DbConnection.resourceNoEscape,
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
                    type : DbConnection.resource,
                    value : subject
                });

                insertString = insertString + " [" + argCount++ + "] ";

                queryArguments.push({
                    type : DbConnection.resource,
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

        //Invalidate cache record for the updated resource
        const Cache = require(Config.absPathInSrcFolder("/kb/cache/cache.js")).Cache;
        //Invalidate cache record for the updated resources
        Cache.get().delete(subject, function(err, result){});

        self.execute(query, queryArguments, function(err, results)
        {
            return callback(err, results);
            //console.log(results);
        });
    }
    else
    {
        return callback(1, "Invalid or no triples sent for insertion / update");
    }
};

DbConnection.prototype.deleteGraph = function(graphUri, callback)
{
    const self = this;

    self.execute("CLEAR GRAPH <"+graphUri+">",
        [],
        function(err, resultsOrErrMessage)
        {
            return callback(err, resultsOrErrMessage);
        }
    );
};

DbConnection.prototype.graphExists = function(graphUri, callback)
{
    const self = this;

    self.execute("ASK { GRAPH [0] { ?s ?p ?o . } }",
        [
            {
                type : DbConnection.resourceNoEscape,
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

DbConnection.buildFromStringAndArgumentsArrayForOntologies = function(ontologyURIsArray, startingArgumentCount)
{
    let i;
    let fromString = "";
    const argumentsArray = [];

    for(i = 0; i < ontologyURIsArray.length; i++)
    {
        const argIndex = i + startingArgumentCount; //arguments array starts with 2 fixed elements

        fromString = fromString + " FROM [" + argIndex +"] \n";

        argumentsArray.push(
            {
                type : DbConnection.resourceNoEscape,
                value : ontologyURIsArray[i]
            }
        );
    }

    return {
        fromString : fromString,
        argumentsArray : argumentsArray
    };
};

DbConnection.buildFilterStringForOntologies = function(ontologyURIsArray, filteredVariableName)
{
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


DbConnection.default = {};

module.exports.DbConnection = DbConnection ;
