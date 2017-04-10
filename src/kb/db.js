var util = require('util');
var Config = function() { return GLOBAL.Config; }();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var uuid = require('uuid');

function DbConnection (host, port, username, password, maxSimultaneousConnections)
{
    var self = this;

    if (!self.host || !self.port) {
        self.host = host;
        self.port = port;
        self.username = username;
        self.password = password;
        if(self.maxSimultaneousConnections == null)
        {
            self.maxSimultaneousConnections = 50;
        }
        else
        {
            self.maxSimultaneousConnections = maxSimultaneousConnections;
        }

        self.pendingTransactionIDs = {};
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
    var self = this;
    var xmlHttp = new XMLHttpRequest();

    // prepare callback
    xmlHttp.onreadystatechange = function() {
        if(xmlHttp.readyState == 4)
        {
            if(xmlHttp.status == 200)
            {
                //self.queueSemaphore = require('semaphore')(self.maxSimultaneousConnections);
                callback(self);
            }
            else
            {
                callback(false);
            }
        }
    };

    var fullUrl = "http://" + self.host;

    if (self.port) {
        fullUrl = fullUrl + ":" + self.port;
    }

    xmlHttp.open("GET", fullUrl, true);
    xmlHttp.send(null);
};


var queryObjectToString = function(query, argumentsArray, callback)
{
    var transformedQuery = query;

    for(var i = 0; i < argumentsArray.length; i++)
    {
        var currentArgumentIndex = "["+i+"]";
        var currentArgument = argumentsArray[i];

        //check for the presence of the parameter placeholder
        if(transformedQuery.indexOf(currentArgumentIndex) != -1)
        {
            //will allow people to use the same parameter several times in the query,
            // for example [0]....[0]...[0] by replacing all occurrences of [0] in the query string
            var pattern = new RegExp("\\\["+i+"\\\]", "g"); // [] are reserved chars in regex!

            switch(currentArgument.type)
            {
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
                    try{
                        var booleanForm = JSON.parse(currentArgument.value);
                        if (!(booleanForm === true || booleanForm === false))
                        {
                            throw new Error();
                        }
                    }
                    catch(e)
                    {
                        var msg = "Unable to convert argument [" + i + "]: It is set as a bolean, but the value is not true or false, it is : " + currentArgument.value;
                        console.error(msg);
                        callback(1, msg);
                        break;
                    }

                    transformedQuery = transformedQuery.replace(pattern, "\"" + encodeURIComponent(booleanForm.toString()) + "\"");

                    break;
                case DbConnection.prefixedResource:

                    var validator = require('validator');

                    if(validator.isURL(currentArgument.value))
                    {
                        transformedQuery = transformedQuery.replace(pattern, "<" + currentArgument.value + ">");
                    }
                    else
                    {
                        var Ontology = require('../models/meta/ontology.js').Ontology;

                        if(currentArgument.value != null)
                        {
                            var indexOfColon = currentArgument.value.indexOf(":");

                            if(indexOfColon > 0)
                            {
                                if(currentArgument.value != null)
                                {
                                    var prefix = currentArgument.value.substr(0, indexOfColon);
                                    var element = currentArgument.value.substr(indexOfColon + 1);
                                    var ontology = Ontology.allOntologies[prefix].uri;
                                    var valueAsFullUri = ontology + element;

                                    transformedQuery = transformedQuery.replace(pattern, "<" + valueAsFullUri + ">");
                                }
                                else
                                {
                                    var error = "Value of argument " + currentArgument.value + " is null. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                                    console.error(error);
                                    callback(1, error);
                                }
                            }
                            else
                            {
                                var error = "Value of argument " + currentArgument.value + " is not valid for an argument of type Prefixed Resource... Did you mean to parametrize it as a string type in the elements.js file?. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                                console.error(error);
                                callback(1, error);
                            }
                        }
                        else
                        {
                            var error = "Cannot Execute Query: Value of argument at index " + currentArgumentIndex + " is undefined. Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                            console.error(error);
                            callback(1, error);
                        }
                    }

                    break;
                case DbConnection.date:
                    transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                    break;
                case DbConnection.long_string:
                    transformedQuery = transformedQuery.replace(pattern, "'''" + encodeURIComponent( currentArgument.value)+ "'''");
                    break;
                case DbConnection.stringNoEscape:
                    transformedQuery = transformedQuery.replace(pattern, "\"" + currentArgument.value + "\"");
                    break;
                default:
                {
                    var error = "Unknown argument type for argument in position "+ i + " with value "+currentArgument.value +". Query supplied was : " + query + " \n " + JSON.stringify(arguments);
                    console.error(error);
                    callback(1, error);
                    break;
                }
            }
        }
        else
        {
            var error = "Error in query "+query+"; Unable to find argument with index "+ i +" .";
            console.error(error);
            callback(1, error);
        }
    }

    callback(null, transformedQuery);
};

DbConnection.prototype.execute = function(queryStringWithArguments, argumentsArray, callback, resultsFormat, maxRows) {

    var self = this;
    queryObjectToString(queryStringWithArguments, argumentsArray, function(err, query){
        if (!err)
        {
            if (self.host && self.port)
            {
                if (typeof resultsFormat == 'undefined') //by default, query format will be json
                {
                    resultsFormat = "application/json";
                }

                if (typeof maxRows == 'undefined') //by default, query format will be json
                {
                    maxRows = Config.limits.db.maxResults;
                }

                var fullUrl = null;

                fullUrl = "http://" + self.host;
                if (self.port)
                {
                    fullUrl = fullUrl + ":" + self.port;
                }

                fullUrl = fullUrl + "/sparql";

                //console.log("waiting for database querying queue");

                var transactionID = uuid.v4();

                //set database operation timeout
                setTimeout(function ()
                {
                    if (self.pendingTransactionIDs[transactionID] != null)
                    {
                        console.error("database operation timeout for query " + queryStringWithArguments + " with transaction ID " + transactionID);
                        delete self.pendingTransactionIDs[transactionID];
                        //self.queueSemaphore.leave();
                    }
                    else
                    {
                        //console.log("database operation timeout for transaction ID " + transactionID + " but operation has been completed.");
                        //self.queueSemaphore.leave();
                    }

                }, Config.dbOperationTimeout);

                //self.queueSemaphore.take(function ()
                //{
                    if (Config.debug.active && Config.debug.database.log_all_queries)
                    {
                        console.log("POSTING QUERY: \n" + query);
                    }

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

                    let rp = require('request-promise');
                    rp(options)
                        .then(function (parsedBody) {
                            var transformedResults = [];
                            // iterate through all the rows in the result list

                            if (parsedBody.boolean != null)
                            {
                                callback(null, parsedBody.boolean);
                            }
                            else
                            {
                                var numberOfRows = parsedBody.results.bindings.length;

                                if (numberOfRows == 0)
                                {
                                    callback(null, []);
                                }
                                else
                                {
                                    // initialize list of headers and matching datatypes
                                    var datatypes = [];
                                    var columnHeaders = [];

                                    for (var i = 0; i < parsedBody.head.vars.length; i++)
                                    {
                                        var columnHeader = parsedBody.head.vars[i];

                                        //handling OPTIONAL clauses, where a header will not have any value
                                        if (parsedBody.results.bindings[0][columnHeader] != null)
                                        {
                                            columnHeaders.push(columnHeader);

                                            if (parsedBody.results.bindings[0][columnHeader] == null)
                                            {
                                                console.log("invalid binding");
                                            }

                                            var type = parsedBody.results.bindings[0][columnHeader].type;
                                            datatypes.push(type);
                                        }
                                    }

                                    var numberOfHeaders = columnHeaders.length;

                                    // util.debug("Headers:\n" + util.inspect(columnHeaders, true,
                                    // null));
                                    // util.debug("Datatypes:\n" + util.inspect(datatypes, true,
                                    // null));

                                    // build results table
                                    for (i = 0; i < numberOfRows; i++)
                                    {
                                        // for each result header, create an empty object to push
                                        // the results
                                        transformedResults[i] = {};

                                        // util.debug("Transformed Results A:\n" +
                                        // util.inspect(transformedResults, true, null));

                                        for (var j = 0; j < numberOfHeaders; j++)
                                        {
                                            var header = columnHeaders[j];

                                            var binding = parsedBody.results.bindings[i];

                                            if (binding != null)
                                            {
                                                if (binding[header] != null)
                                                {
                                                    var datatype;
                                                    if (binding[header] != null)
                                                    {
                                                        datatype = binding[header].type;
                                                    }
                                                    else
                                                    {
                                                        datatype = datatypes[j];
                                                    }

                                                    var value = binding[header].value;

                                                    switch (datatype)
                                                    {
                                                        case ("http://www.w3.org/2001/XMLSchema#integer"):
                                                        {
                                                            var newInt = parseInt(value);
                                                            transformedResults[" + i + "].header = newInt;
                                                            break;
                                                        }
                                                        case ("uri"):
                                                        {
                                                            transformedResults[i][header] = decodeURI(value);
                                                            break;
                                                        }
                                                        // default is a string value
                                                        default:
                                                        {
                                                            var valueWithQuotes = decodeURIComponent(value).replace(/\"/g, "\\\"");
                                                            transformedResults[i][header] = valueWithQuotes;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // util.debug("Transformed Results :\n" +
                                    // util.inspect(transformedResults, true, null));

                                    //delete self.pendingTransactionIDs[transactionID];
                                    //self.queueSemaphore.leave();
                                    callback(null, transformedResults);
                                }
                            }
                        })
                        .catch(function(err){
                            const error = "Virtuoso server returned error: \n " + util.inspect(err);
                            //console.trace(err);
                            console.error(error);

                            //delete self.pendingTransactionIDs[transactionID];
                            //self.queueSemaphore.leave();
                            callback(1, err);
                        });
                //});
            }
            else
            {
                callback(1, "Database connection must be set first");
            }
        }
        else
        {
            var msg = "Something went wrong with the query generation. Error reported: " + query;
            console.error(msg);
            callback(1, msg);
        }
    });
};

DbConnection.addLimitsClauses = function(query, offset, maxResults)
{
    if(offset != null &&
        typeof offset == "number" &&
        offset > 0)
    {
        query = query + " OFFSET " + offset + "\n";
    }

    if(maxResults != null &&
        typeof maxResults == "number" &&
        maxResults > 0)
    {
        query = query + " LIMIT "+ maxResults + " \n";
    }

    return query;
};

DbConnection.pushLimitsArguments = function(unpaginatedArgumentsArray, maxResults, offset)
{
    if(offset != null &&
        typeof offset == "int" &&
        offset > 0)
    {
        unpaginatedArgumentsArray = unpaginatedArgumentsArray.push({
            type : DbConnection.int,
            value : maxResults
        });
    }

    if(maxResults != null &&
        typeof maxResults == "int" &&
        maxResults > 0)
    {
        unpaginatedArgumentsArray = unpaginatedArgumentsArray.push({
            type : DbConnection.int,
            value : maxResults
        });
    }

    return unpaginatedArgumentsArray;
}

DbConnection.paginate = function(req, viewVars) {
    if(req != null && req.query != null)
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
    if(req != null && req.query != null)
    {
        if(req.query.currentPage == null)
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

        var skip = req.query.pageSize * req.query.currentPage;

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
    var self = this;

    if(!triple.subject  || !triple.predicate || !triple.object)
    {
        var error =  "Attempted to insert an invalid triple, missing one of the three required elements ( subject-> " + triple.subject + " predicate ->" + triple.predicate + " object-> " + triple._object +" )"
        console.error(error);
        callback(1, error);
    }
    else
    {
        if(triple.subject.substring(0, "\"".length) === "\"")
        {
            //http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
            //literals should not be subjects nor properties, even though it is allowed by the RDF spec.
            callback(1, "Subjects should not be literals");
        }
        else if(triple.predicate.substring(0, "\"".length) === "\"")
        {
            //http://answers.semanticweb.com/questions/17060/are-literals-allowed-as-subjects-or-predicates-in-rdf
            //literals should not be subjects, even though it is allowed by the RDF spec.
            callback(1, "Predicates should not be literals");
        }
        else
        {
            var query = " WITH GRAPH <" + graphUri + ">" +
                " INSERT { " +
                "<" + triple.subject + "> " +
                "<" + triple.predicate + "> ";

            //we have an url (it is a resource and not a literal)
            if(triple.object.substring(0, "\"".length) === "\"")
            {
                //remove first and last " symbols, escape remaining special characters inside the text and re-add the "" for the query.

                var escapedObject = triple.object.substring(1);
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

            let redis = GLOBAL.redis.default;
            //Invalidate cache record for the updated resources
            redis.connection.delete([triple.subject, triple.object], function(err, result){});

            self.execute(query,
               function(error, results)
               {
                   if(error == null)
                   {
                       callback(null);
                   }
                   else
                   {
                       callback(1, ("Error inserting triple " + triple.subject + " " + triple.predicate + " "  + triple.object +"\n").substr(0,200) +" . Server returned " + error);
                   }
               }
            );
        }
    }
};

DbConnection.prototype.deleteTriples = function(triples, graphName, callback)
{
    if(triples != null && triples instanceof Array && triples.length > 0)
    {
        var self = this;

        var triplesToDeleteString = "";
        var nullObjectCount = 0;
        var i;
        var argCount = 1;

        var arguments = [
            {
                type : DbConnection.resourceNoEscape,
                value : graphName
            }
        ];

        var urisToDelete = [];

        for(i=0; i < triples.length ; i++)
        {
            var triple = triples[i];

            if(Config.cache.active)
            {
                urisToDelete.push(triple.subject);
                urisToDelete.push(triple.object);
            }

            if(triple.subject != null && triple.predicate != null)
            {
                //build the delete string
                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                arguments.push({
                    type : DbConnection.resource,
                    value : triple.subject
                });


                triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                arguments.push({
                    type : DbConnection.resource,
                    value : triple.predicate
                });

                if(triple.object != null)
                {
                    triplesToDeleteString = triplesToDeleteString + " [" + argCount++ + "]";

                    arguments.push({
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

        var query = "WITH [0] \n" +
                    "DELETE { "+
                        triplesToDeleteString + " \n" +
                    "} \n" +
                    " WHERE { "+
                        triplesToDeleteString + " \n" +
                    "}\n";

        /**
         * Invalidate cached records because of the deletion
         */
        if(Config.cache.active)
        {
            let redis = GLOBAL.redis.default;
            redis.connection.delete(urisToDelete, function(err, result)
            {
                if (err != null)
                {
                    console.log("[DEBUG] Deleted cache records for triples " + JSON.stringify(triples) + ". Error Reported: " + result);
                }
            });
        }

        self.execute(query, arguments, function(err, results)
        {
            callback(err, results);
        });
    }
    else
    {
        callback(1, "Invalid or no triples sent for insertion / update");
    }
};

DbConnection.prototype.insertDescriptorsForSubject = function(subject, newDescriptorsOfSubject, graphName, callback)
{
    var self = this;

    if(newDescriptorsOfSubject != null && newDescriptorsOfSubject instanceof Object)
    {
        var insertString = "";
        var argCount = 1;

        var arguments = [
            {
                type : DbConnection.resourceNoEscape,
                value : graphName
            }
        ];

        for(var i = 0; i < newDescriptorsOfSubject.length; i++)
        {
            var newDescriptor = newDescriptorsOfSubject[i];
            var objects = newDescriptor.value;

            if(!(objects instanceof Array))
            {
                objects = [objects];
            }

            for(var j = 0; j < objects.length ; j++)
            {

                insertString = insertString + " [" + argCount++ + "] ";

                arguments.push({
                    type : DbConnection.resource,
                    value : subject
                });

                insertString = insertString + " [" + argCount++ + "] ";

                arguments.push({
                    type : DbConnection.resource,
                    value : newDescriptor.uri
                });

                insertString = insertString + " [" + argCount++ + "] ";

                arguments.push({
                    type : newDescriptor.type,
                    value : objects[j]
                });

                insertString = insertString + ".\n";
            }
        }

        var query =
            "WITH GRAPH [0] \n"+
                "INSERT DATA\n" +
                "{ \n"+
                    insertString + " \n" +
                "} \n";

        //Invalidate cache record for the updated resource
        let redis = GLOBAL.redis.default;
        redis.connection.delete(subject, function(err, result){});

        self.execute(query, arguments, function(err, results)
        {
            callback(err, results);
            //console.log(results);
        });
    }
    else
    {
        callback(1, "Invalid or no triples sent for insertion / update");
    }
}

DbConnection.prototype.deleteGraph = function(graphUri, callback)
{
    var self = this;

    self.execute("CLEAR GRAPH <"+graphUri+">",
        [],
        function(err, resultsOrErrMessage)
        {
            callback(err, resultsOrErrMessage);
        }
    );
};

DbConnection.prototype.graphExists = function(graphUri, callback)
{
    var self = this;

    self.execute("ASK { GRAPH [0] { ?s ?p ?o . } }",
        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            }
        ],
        function(err, result)
        {
            if(err == null)
            {
                if(result == true)
                {
                    callback(err, true);
                }
                else
                {
                    callback(err, false);
                }
            }
            else
            {
                callback(err, null);
            }
        }
    );
};

DbConnection.buildFromStringAndArgumentsArrayForOntologies = function(ontologyURIsArray, startingArgumentCount)
{
    var i;
    var fromString = "";
    var argumentsArray = [];

    for(i = 0; i < ontologyURIsArray.length; i++)
    {
        var argIndex = i + startingArgumentCount; //arguments array starts with 2 fixed elements

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
}

DbConnection.buildFilterStringForOntologies = function(ontologyURIsArray, filteredVariableName)
{
    var filterString = "";

    if(ontologyURIsArray != null && ontologyURIsArray instanceof Array)
    {
        if(ontologyURIsArray.length > 0)
        {
            filterString = filterString + "FILTER( ";

            for(var i = 0; i < ontologyURIsArray.length; i++)
            {
                var ontologyUri = ontologyURIsArray[i];
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
}


DbConnection.default = {};

module.exports.DbConnection = DbConnection ;
