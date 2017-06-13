var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Elements = require(Config.absPathInSrcFolder("/models/meta/elements.js")).Elements;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var IndexConnection = require(Config.absPathInSrcFolder("/kb/index.js")).IndexConnection;

var async = require('async');
var _ = require('underscore');

var db = function() { return GLOBAL.db.default; }();

var redis = function(graphUri)
{
    if(graphUri == null || typeof graphUri === "undefined" || !graphUri)
    {
        if(GLOBAL.redis.default != null)
        {
            //console.log('ENTRAR DEFAULT REDIS:');
            return GLOBAL.redis.default;
        }
        else
        {
            console.error("DEU ASNEIRA");
            process.exit(1);
        }

    }
    else
    {
        return Config.caches[graphUri];
    }
};

function Resource (object)
{
    Resource.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }

    self.copyOrInitDescriptors(object);

    return self;
}

Resource.prototype.copyOrInitDescriptors = function(object, deleteIfNotInArgumentObject)
{
    var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
    var self = this;

    var ontologyPrefixes = Ontology.getAllOntologyPrefixes();
    for(var i = 0; i < ontologyPrefixes.length; i++)
    {
        var aPrefix = ontologyPrefixes[i];
        if(self[aPrefix] == null)
        {
            if(object[aPrefix] == null || typeof object[aPrefix] == "undefined")
            {
                self[aPrefix] = {};
            }
            else if(object[aPrefix] instanceof Object)
            {
                self[aPrefix] = object[aPrefix];
            }
        }
        else if(self[aPrefix] != null)
        {
            if(deleteIfNotInArgumentObject)
            {
                if(object[aPrefix] == null)
                {
                    self[aPrefix] = {};
                }
            }
        }
    }
};

Resource.all = function(callback, req, customGraphUri, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval)
{
    var self = this;
    var type = self.prefixedRDFType;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var query =
        "SELECT ?uri " +
        "FROM [0]" +
        "WHERE " +
        "{ ";

    if(type != null)
    {
        query = query + "   ?uri rdf:type [1] "
    }


    query = query + "} \n";

    if(req != null)
    {
        var viewVars = {
            title : 'All vertexes in the knowledge base'
        };

        req.viewVars = DbConnection.paginate(req,
            viewVars
        );

        query = DbConnection.paginateQuery(
            req,
            query
        );
    }

    var arguments = [
        {
            type : DbConnection.resourceNoEscape,
            value : graphUri
        }
    ];

    if(type != null)
    {
        arguments.push({
            type : DbConnection.prefixedResource,
            value : type
        });
    }

    db.connection.execute(
        query,
        arguments,
        function(err, results) {
            if(!err)
            {
                async.map(results,
                    function(result, cb)
                    {
                        var aResource = new self.prototype.constructor(result);
                        self.findByUri(aResource.uri, function(err, completeResource){

                            if(descriptorTypesToRemove != null && descriptorTypesToRemove instanceof Array)
                            {
                                completeResource.clearDescriptors(descriptorTypesToExemptFromRemoval, descriptorTypesToRemove);
                            }

                            cb(err, completeResource);
                        });
                    },
                    function(err, results)
                    {
                        callback(err, results);
                    });
            }
            else
            {
                callback(1, "Unable to fetch all resources from the graph");
            }
        });
};

/**
 * Removes all the triples with this resource as their subject
 * @type {updateDescriptors}
 */
Resource.prototype.deleteAllMyTriples = function(callback, customGraphUri)
{
    var self = this;
    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    //Invalidate cache record for the updated resources
    redis(customGraphUri).connection.delete(self.uri, function(err, result){

    });

    //TODO CACHE DONE
    db.connection.execute(
            "WITH [0] \n" +
            "DELETE \n" +
            "WHERE " +
            "{ \n" +
                "[1] ?p ?o \n" +
            "} \n",
        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            }
        ],
        function(err, results) {
            if(!err)
            {
                callback(err, results);
            }
            else
            {
                callback(1, results);
            }
        });
};

/**
 * Removes all the triples with this resource as their subject, predicateInPrefixedForm
 * as the predicate and value as the object
 * @param predicateInPrefixedForm
 * @param value
 * @param callback
 */
Resource.prototype.deleteDescriptorTriples = function(descriptorInPrefixedForm, callback, valueInPrefixedForm, customGraphUri)
{
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    if(descriptorInPrefixedForm != null)
    {
        if(valueInPrefixedForm != null)
        {
            //TODO CACHE DONE
            db.connection.execute(
                    "WITH [0] \n" +
                    "DELETE \n" +
                    "WHERE " +
                    "{ " +
                    "   [1] [2] [3] " +
                    "} \n",
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : DbConnection.resource,
                        value : self.uri
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : descriptorInPrefixedForm
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : valueInPrefixedForm
                    }
                ],
                function(err, results) {
                    if(!err)
                    {
                        //Invalidate cache record for the updated resources
                        redis(customGraphUri).connection.delete([self.uri, valueInPrefixedForm], function(err, result){
                            callback(err, result);
                        });
                    }
                    else
                    {
                        callback(1, results);
                    }
                });
        }
        else
        {
            //TODO CACHE DONE
            db.connection.execute(
                    "WITH [0] \n" +
                    "DELETE \n" +
                    "WHERE " +
                    "{ " +
                    "   [1] [2] ?o " +
                    "} \n",
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : DbConnection.resource,
                        value : self.uri
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : descriptorInPrefixedForm
                    }
                ],
                function(err, results) {
                    if(!err)
                    {
                        //Invalidate cache record for the updated resources
                        redis(customGraphUri).connection.delete([self.uri, valueInPrefixedForm], function(err, result){
                            callback(err, result);
                        });
                    }
                    else
                    {
                        callback(1, results);
                    }
                });
        }
    }
    else
    {
        var msg = "No descriptor specified --> Descriptor " + descriptorInPrefixedForm;
        console.error(msg);
        callback(1, msg);
    }
};

Resource.prototype.descriptorValue = function(descriptorWithNamespaceSeparatedByColon, callback, customGraphUri)
{
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    db.connection.execute(
            "WITH [0] \n" +
            "SELECT ?p ?o \n" +
            "WHERE " +
            "{" +
                " [1] [2] ?o " +
            "} \n",
        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            },
            {
                type : DbConnection.resource,
                value : self.uri
            },
            {
                type : DbConnection.prefixedResource,
                value : descriptorWithNamespaceSeparatedByColon
            }
        ],
        function(err, results) {
            if(!err)
            {
                var extractedResults = [];
                for(var i = 0; i < results.length; i++)
                {
                    extractedResults.push(results[i].o);
                }

                callback(err, extractedResults);
            }
            else
            {
                callback(1, results);
            }
        });
};

Resource.prototype.clearOutgoingPropertiesFromOntologies = function(ontologyURIsArray, callback, customGraphUri)
{
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    self.getPropertiesFromOntologies(ontologyURIsArray, function(err, descriptors)
    {
        var triplesToDelete = [];
        for(var i = 0; i < descriptors.length; i++)
        {
            var descriptor = descriptors[i];
            triplesToDelete.push({
                subject : self.uri,
                predicate : descriptor.uri,
                object : null
            });
        }

        db.deleteTriples(triplesToDelete, db.graphUri, callback);
    }, graphUri);
};

/**
 * Loads properties into this resource object
 * @param ontologyURIsArray
 * @param callback
 * @param customGraphUri
 */

Resource.prototype.loadPropertiesFromOntologies = function(ontologyURIsArray, callback, customGraphUri)
{
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    //build arguments string from the requested ontologies,
    // as well as the FROM string with the parameter placeholders
    var argumentsArray = [
        {
            type : DbConnection.resourceNoEscape,
            value : graphUri
        },
        {
            type : DbConnection.resource,
            value : self.uri
        }
    ];

    var fromString = "";
    var filterString = "";

    if(ontologyURIsArray != null)
    {
        var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(ontologyURIsArray, argumentsArray.length);
        filterString = DbConnection.buildFilterStringForOntologies(ontologyURIsArray, "uri");

        argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
        fromString = fromString + fromElements.fromString;
    }

    var query =
        " SELECT DISTINCT ?uri ?value ?label ?comment \n"+
        " FROM [0] \n"+
        fromString + "\n" +
        " WHERE \n" +
        " { \n"+
        " [1] ?uri ?value .\n" +
        " OPTIONAL \n" +
        "{  \n" +
        "?uri    rdfs:label  ?label .\n " +
        "FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
        "} .\n" +
        " OPTIONAL " +
        "{  \n" +
        "?uri  rdfs:comment   ?comment. \n" +
        "FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
        "} .\n" +

        filterString +
        " } \n";

    db.connection.execute(query,
        argumentsArray,
        function(err, descriptors) {
            if(!err)
            {
                var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
                for (var i = 0; i < descriptors.length; i++)
                {
                    var descriptor = new Descriptor(descriptors[i]);
                    var prefix = descriptor.prefix;
                    var shortName = descriptor.shortName;
                    if (prefix != null && shortName != null)
                    {
                        if (self[prefix] == null)
                        {
                            self[prefix] = {};
                        }

                        if (self[prefix][shortName] != null)
                        {
                            //if there is already a value for this object, put it in an array
                            if (!(self[prefix][shortName] instanceof Array))
                            {
                                self[prefix][shortName] = [self[prefix][shortName]];

                            }

                            self[prefix][shortName].push(descriptor.value);
                        }
                        else
                        {
                            self[prefix][shortName] = descriptor.value;
                        }
                    }
                }

                callback(null, self);
            }
            else
            {
                console.error("Error fetching descriptors from ontologies : "+ JSON.stringify(ontologyURIsArray)+ ". Error returned : " + descriptors);
                callback(1, descriptors);
            }
        });
}

/**
 * Retrieves properties of this resource object as array of descriptors
 * @param ontologyURIsArray
 * @param callback
 * @param customGraphUri
 */

Resource.prototype.getPropertiesFromOntologies = function(ontologyURIsArray, callback, customGraphUri)
{
    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    //build arguments string from the requested ontologies,
    // as well as the FROM string with the parameter placeholders
    var argumentsArray = [
        {
            type : DbConnection.resourceNoEscape,
            value : graphUri
        },
        {
            type : DbConnection.resource,
            value : self.uri
        }
    ];

    var fromString = "";
    var filterString = "";

    if(ontologyURIsArray != null)
    {
        var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(ontologyURIsArray, argumentsArray.length);
        filterString = DbConnection.buildFilterStringForOntologies(ontologyURIsArray, "uri");

        argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
        fromString = fromString + fromElements.fromString;
    }

    var query =
            " SELECT DISTINCT ?uri ?value ?label ?comment \n"+
            " FROM [0] \n"+
            fromString + "\n" +
            " WHERE \n" +
            " { \n"+
                " [1] ?uri ?value .\n" +
                " OPTIONAL \n" +
                "{  \n" +
                    "?uri    rdfs:label  ?label .\n " +
                    "FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
                 "} .\n" +
                " OPTIONAL " +
                "{  \n" +
                    "?uri  rdfs:comment   ?comment. \n" +
                    "FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
                "} .\n" +

                filterString +
            " } \n";

    db.connection.execute(query,
        argumentsArray,
        function(err, descriptors) {
            if(!err)
            {
                var formattedResults = [];

                for(var i = 0; i < descriptors.length; i++)
                {
                    try{
                        var formattedDescriptor = new Descriptor(descriptors[i]);
                    }
                    catch(e)
                    {
                        console.error(JSON.stringify(e));
                    }

                    formattedResults.push(formattedDescriptor);
                }

                callback(0, formattedResults);
            }
            else
            {
                console.error("Error fetching descriptors from ontologies : "+ JSON.stringify(ontologyURIsArray)+ ". Error returned : " + descriptors);
                callback(1, descriptors);
            }
        });
}

Resource.prototype.validateDescriptorValues = function(callback)
{
    var self = this;
    var descriptorsArray = self.getDescriptors();

    var descriptorValueIsWithinAlternatives = function(descriptor, callback)
    {
        if (descriptor.hasAlternative != null && descriptor.hasAlternative instanceof Array)
        {
            var alternatives = descriptor.hasAlternative;

            var detectedAlternative = false;

            for(var i = 0; i < alternatives.length; i++)
            {
                if(descriptor.value === alternatives[i])
                {

                    callback(null, null);
                    detectedAlternative = true;
                    break;
                }
            }

            if(!detectedAlternative)
            {
                var error = "[ERROR] Value \""+ descriptor.value +"\" of descriptor " + descriptor.uri + " is invalid, because it is not one of the valid alternatives " + JSON.stringify(descriptor.hasAlternative) +". " +
                    "This error occurred when checking the validity of the descriptors of resource " + self.uri;
                console.error(error);
                callback(1, error);
            }
        }
        else
        {
            callback(null, null);
        }
    }

    var descriptorValueConformsToRegex = function(descriptor, callback)
    {
        if (descriptor.hasRegex != null && (typeof descriptor.hasRegex === 'string'))
        {
            var regex = new RegExp(descriptor.hasRegex);

            if (!regex.match(descriptor.value))
            {
                var error = "[ERROR] Value \""+ descriptor.value +"\" of descriptor " + descriptor.uri + " is invalid, because it does not comply with the regular expression " + descriptor.hasRegex +". " +
                    "This error occurred when checking the validity of the descriptors of resource " + self.uri;
                console.error(error);
                callback(1, error);
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
    };

    async.detectSeries(descriptorsArray,
        function(descriptor, callback){
            async.series(
                [
                    async.apply(descriptorValueIsWithinAlternatives, descriptor),
                    async.apply(descriptorValueConformsToRegex, descriptor)
                ],
                function(firstError)
                {
                    callback(firstError);
                }
            )
        },
        function(err, errors){
            if(err)
            {
                console.error("Error detected while validating descriptors: " + JSON.stringify(errors));
            }

            callback(err, errors);
        }
    );
};


Resource.prototype.replaceDescriptorsInTripleStore = function(newDescriptors, graphName, callback)
{
    var self = this;
    var subject = self.uri;

    if(newDescriptors != null && newDescriptors instanceof Object)
    {
        var deleteString = "";
        var insertString = "";

        var predCount = 0;
        var argCount = 1;

        var arguments = [
            {
                type : DbConnection.resourceNoEscape,
                value : graphName
            }
        ];

        //build the delete string
        deleteString = deleteString + " [" + argCount++ + "]";

        arguments.push({
            type : DbConnection.resource,
            value : subject
        });

        deleteString = deleteString + " ?p"+ predCount++;
        deleteString = deleteString + " ?o"+ predCount++ + " . \n";

        for(var i = 0; i < newDescriptors.length; i++)
        {
            var newDescriptor = newDescriptors[i];

            var objects = newDescriptor.value;

            if(objects != null)
            {
                //build insertion string (using object values for each of the predicates)
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
        }

        var query =
            "WITH GRAPH [0] \n"+
            "DELETE \n" +
            "{ \n" +
            deleteString + " \n" +
            "} \n"+
            "WHERE \n" +
            "{ \n"+
            deleteString + " \n" +
            "}; \n"+
            "INSERT DATA\n" +
            "{ \n"+
            insertString + " \n" +
            "} \n";

        //Invalidate cache record for the updated resources
        redis().connection.delete(subject, function(err, result){});

        db.connection.execute(query, arguments, function(err, results)
        {
            callback(err, results);
            //console.log(results);
        });
    }
    else
    {
        callback(1, "Invalid or no triples sent for insertion / update");
    }
};

/**
 * Persists the current state of the resource to the database
 * @param saveVersion save a revision of the resource
 * @param callback
 * @param entitySavingTheResource
 * @param descriptorsToExcludeFromChangesCalculation
 * @param descriptorsToExcludeFromChangeLog
 * @param descriptorsToExceptionFromChangeLog
 * @param customGraphUri if the resource is not to be saved in the main graph of the Dendro instance, speciby the uri of the other graph where to save the resource.
 */

Resource.prototype.save = function
    (
        callback,
        saveVersion,
        entitySavingTheResource,
        descriptorsToExcludeFromChangesCalculation,
        descriptorsToExcludeFromChangeLog,
        descriptorsToExceptionFromChangeLog,
        customGraphUri
    )
{
    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var now = new Date();
    self.dcterms.modified = now.toISOString();

    var validateValues = function(cb)
    {
        self.validateDescriptorValues(function(err, results){
            if(err)
            {
                console.error("Error validating values before saving resource " + self.uri + " : " + JSON.stringify(results));
            }
            cb(err, results);
        });
    };

    var getMyLastSavedVersion = function(myUri, cb)
    {
        Resource.findByUri(myUri, function(err, currentResource)
        {
            cb(err, currentResource);
        }, null, customGraphUri);
    };

    var calculateChangesBetweenResources = function(currentResource, newResource, cb)
    {
        var changes = currentResource.calculateDescriptorDeltas(self, descriptorsToExcludeFromChangesCalculation);
        cb(null, currentResource, changes);
    };

    var archiveResource = function(resourceToBeArchived, entityArchivingTheResource, changes, descriptorsToExcludeFromChangeLog, descriptorsToExceptionFromChangeLog, cb)
    {
        resourceToBeArchived.makeArchivedVersion(entitySavingTheResource, function(err, archivedResource)
        {
            if(!err)
            {
                var saveChange = function(change, cb)
                {
                    var changedDescriptor = new Descriptor({
                        uri : change.ddr.changedDescriptor
                    });

                    /**Force audit descriptors not to be recorded as changes;
                     * changes are visible in the system, we dont want them to
                     * appear in listings of change logs, for example. They are
                     * audit information, produced automatically, so they are
                     * changed without record**/

                    if(descriptorsToExcludeFromChangeLog instanceof Array)
                    {
                        var excludeAuditDescriptorsArray = descriptorsToExcludeFromChangeLog.concat([Config.types.audit]);
                    }
                    else
                    {
                        var excludeAuditDescriptorsArray = [Config.types.audit];
                    }

                    if(changedDescriptor.isAuthorized(excludeAuditDescriptorsArray, descriptorsToExceptionFromChangeLog))
                    {
                        change.ddr.pertainsTo = archivedResource.uri;
                        change.uri = archivedResource.uri + "/change/" + change.ddr.changeIndex ;
                        change.save(function(err, result)
                        {
                            cb(err, result);
                        });
                    }
                    else
                    {
                        cb(null, null);
                    }
                }

                async.map(changes, saveChange, function(err, results)
                {
                    if(!err)
                    {
                        archivedResource.save(function(err, savedArchivedResource)
                        {
                            cb(err, savedArchivedResource);
                        });
                    }
                    else
                    {
                        console.error("Error saving changes to resource  " + archivedResource.uri +  ". Error reported : " + err);
                        cb(1, results);
                    }
                });
            }
            else
            {
                console.error("Error making archived version of resource with URI : "+ self.uri + ". Error returned : " + archivedResource);
                cb(1, archivedResource);
            }
        });
    };

    var updateResource = function(currentResource, newResource, cb)
    {
        var newDescriptors= newResource.getDescriptors();
        self.replaceDescriptorsInTripleStore(
            newDescriptors,
            graphUri,
            function(err, result)
            {
                cb(err, result);
            }
        );
    };

    var createNewResource = function(resource, cb)
    {
        var allDescriptors = resource.getDescriptors();

        db.connection.insertDescriptorsForSubject(
            resource.uri,
            allDescriptors,
            graphUri,
            function(err, result)
            {
                if(!err)
                {
                    cb(null, self);
                }
                else
                {
                    cb(err, result);
                }
            }
        );
    };

    async.waterfall([
        function(cb)
        {
            validateValues(function(err, results)
            {
                if(!err)
                {
                    cb(err);
                }
                else
                {
                    cb(err, results);
                }

            });
        },
        function(cb)
        {
            getMyLastSavedVersion(self.uri, cb);
        },
        function(currentResource, cb)
        {
            if(currentResource == null)
            {
                createNewResource(self, function(err, result)
                {
                    //there was no existing resource with same URI, create a new one and exit immediately
                    callback(err, result);
                });
            }
            else if(saveVersion)
            {
                calculateChangesBetweenResources(currentResource, self, function(err, currentResource, changes){
                    cb(err, currentResource, changes);
                });
            }
            else
            {
                cb(null, currentResource, null)
            }
        },
        function(currentResource, changes, cb)
        {
            if(saveVersion)
            {
                if(changes != null && changes instanceof Array && changes.length > 0)
                {
                    archiveResource(
                        currentResource,
                        entitySavingTheResource,
                        changes,
                        descriptorsToExcludeFromChangeLog,
                        descriptorsToExceptionFromChangeLog,
                        function(err, archivedResource)
                        {
                            cb(err, currentResource, archivedResource);
                        });
                }
                else
                {
                    //Nothing to be done, zero changes detected
                    callback(null, self);
                }
            }
            else
            {
                cb(null, currentResource, null);
            }
        },
        function(currentResource, archivedResource, cb)
        {
            if(saveVersion)
            {
                if(currentResource != null && archivedResource != null)
                {
                    updateResource(currentResource, self, cb);
                }
                else
                {
                    cb(1, "Unable to archive resource or to get current one.");
                }
            }
            else
            {
                updateResource(currentResource, self, cb);
            }
        }
    ],
    function(err, result)
    {
        if(!err)
        {
            callback(err, self);
        }
        else
        {
            callback(err, result);
        }
    });
};

/**
 * Update descriptors with the ones sent as argument, leaving existing descriptors untouched
 * MERGE DESCRIPTORS BEFORE CALLING (for cases when descriptor values are arrays)
 * @param descriptors
 * @param callback
 */

Resource.prototype.updateDescriptors = function(descriptors, cannotChangeTheseDescriptorTypes, unlessTheyAreOfTheseTypes)
{
    var self = this;

    //set only the descriptors sent as argument
    for(var i = 0; i < descriptors.length; i++)
    {
        var descriptor = descriptors[i];
        if(descriptor.prefix != null && descriptor.shortName != null)
        {
            if(descriptor.isAuthorized(cannotChangeTheseDescriptorTypes, unlessTheyAreOfTheseTypes))
            {
                self[descriptor.prefix][descriptor.shortName] = descriptor.value;
            }
        }
        else
        {
            var util = require('util');
            var error = "Descriptor " + util.inspect(descriptor) + " does not have a prefix and a short name.";
            console.error(error);
        }
    }

    return self;
};

/**
 * Used for deleting a resource.
 * Resources pointing to this resource will not be deleted.
 *
 * Only triples with this resource as their subject will be deleted.
 */
Resource.prototype.clearAllDescriptors = function()
{
    var self = this;
    self.copyOrInitDescriptors({}, true);
    return self;
};

/**
 * Used for deleting a resource.
 * Resources pointing to this resource will not be deleted.
 *
 * Only triples with this resource as their subject will be deleted.
 */
Resource.prototype.clearDescriptors = function(descriptorTypesToClear, exceptionedDescriptorTypes)
{
    var self = this;

    var myDescriptors = self.getDescriptors(descriptorTypesToClear, exceptionedDescriptorTypes);
    self.clearAllDescriptors();

    self.updateDescriptors(myDescriptors);
};

/**
 * Replace descriptors with the ones sent as argument
 * MERGE DESCRIPTORS BEFORE CALLING
 * @param descriptors
 */


Resource.prototype.replaceDescriptors = function(newDescriptors, cannotChangeTheseDescriptorTypes, unlessTheyAreOfTheseTypes)
{
    let self = this;
    let currentDescriptors = self.getDescriptors();
    let newDescriptorsUris = [];

    //update descriptors with new ones
    for(let i = 0; i < newDescriptors.length; i++)
    {
        let newDescriptor = newDescriptors[i];
        let newDescriptorPrefix =  newDescriptor.prefix;
        let newDescriptorShortName =  newDescriptor.shortName;
        newDescriptorsUris.push(newDescriptor.uri);

        if(newDescriptor.isAuthorized(cannotChangeTheseDescriptorTypes, unlessTheyAreOfTheseTypes))
        {
            self[newDescriptorPrefix][newDescriptorShortName] = newDescriptor.value;
        }
    }

    //clean other authorized descriptors that
    // were not changed not included in
    // newDescriptors

    for(let i = 0; i < currentDescriptors.length; i++)
    {
        let currentDescriptor = currentDescriptors[i];
        let currentDescriptorPrefix =  currentDescriptor.prefix;
        let currentDescriptorShortName =  currentDescriptor.shortName;

        if(!_.contains(newDescriptorsUris, currentDescriptor.uri))
        {
            if(currentDescriptor.isAuthorized(cannotChangeTheseDescriptorTypes, unlessTheyAreOfTheseTypes))
            {
                delete self[currentDescriptorPrefix][currentDescriptorShortName];
            }
        }
    }

    return self;
};

Resource.prototype.getLiteralPropertiesFromOntologies = function(ontologyURIsArray, returnAsFlatArray, callback, customGraphUri)
{
    var self = this;
    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var argumentsArray = [
        {
            type : DbConnection.resourceNoEscape,
            value : graphUri
        },
        {
            type : DbConnection.resource,
            value : self.uri
        }
    ];

    var fromString = "";
    var filterString = "";

    if(ontologyURIsArray != null)
    {
        var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(ontologyURIsArray, argumentsArray.length);
        filterString = DbConnection.buildFilterStringForOntologies(ontologyURIsArray, "property");

        argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
        fromString = fromString + fromElements.fromString;
    }

    db.connection.execute(
            "SELECT ?property ?object\n" +
            " FROM [0] \n"+
            fromString + "\n" +
            "WHERE \n"+
            "{ \n" +
                " [1] ?property ?object. \n" +
                " OPTIONAL { \n" +
                "   ?property  rdfs:label      ?label  .\n" +
                    "FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
                "}" +
                " OPTIONAL { " +
                "   ?property  rdfs:comment    ?comment ." +
                "   FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
                "} .\n" +
                " FILTER isLiteral(?object) .\n" +
                filterString +
            "} \n",
            argumentsArray
        ,
        function(err, results)
        {
            if(err)
            {
                var error = "error retrieving literal properties for resource " + self.uri;
                console.log(error);
                callback(1, error);
            }
            else
            {
                if(returnAsFlatArray)
                {
                    callback(null, results);
                }
                else
                {
                    var propertiesObject = groupPropertiesArrayIntoObject(results);
                    callback(null, propertiesObject);
                }
            }
        });
}

Resource.prototype.reindex = function(indexConnection, callback)
{
    var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
    var self = this;
    var infoMessages = [];
    var errorMessages = [];

    self.getLiteralPropertiesFromOntologies(
            Ontology.getPublicOntologiesUris()
        ,
        true,
        function(err, results)
    {
        if(!err && results != null)
        {
            const now = new Date();

            for(let i = 0; i < results.length; i++)
            {
                results[i].predicate = results[i].property;
                delete results[i].property;
            }

            var document = {
                    uri : self.uri,
                    graph : indexConnection.index.uri,
                    descriptors : results,
                    last_indexing_date : now.toISOString()
            };

            //console.log("Reindexing resource " + self.uri);
            //console.log("Document: \n" + JSON.stringify(document, null, 4));

            self.getIndexDocumentId(indexConnection, function(err, id)
            {
                if(!err)
                {
                    if(id != null)
                    {
                        document._id = id;
                    }

                    indexConnection.indexDocument(
                        IndexConnection.indexTypes.resource,
                        document,
                        function(err, result)
                        {
                            if(!err)
                            {
                                infoMessages.push(results.length + " resources successfully reindexed in index " + indexConnection.index.short_name);
                                callback(null, infoMessages);
                            }
                            else
                            {
                                const msg = "Error deleting old document for resource " + self.uri + " error returned " + result;
                                errorMessages.push(msg);
                                console.error(msg);
                                callback(1, errorMessages);
                            }
                        });
                }
                else
                {
                    errorMessages.push("Error getting document id for resource " + self.uri + " error returned " + id);
                    callback(1, errorMessages);
                }
            });
        }
        else
        {
            infoMessages.push("Node "+ self.uri + " has no literal properties to be indexed, moving on");
            callback(null, errorMessages);
        }
    });
}

Resource.prototype.getIndexDocumentId = function(indexConnection, callback)
{
    let self = this;

    self.restoreFromIndexDocument(indexConnection, function(err, restoredResource)
    {
        if(self.indexData != null)
        {
            callback(err, self.indexData.id);
        }
        else
        {
            callback(err, null);
        }
    });
};

Resource.prototype.getTextuallySimilarResources = function(indexConnection, maxResultSize, callback)
{
    let self = this;

    self.getIndexDocumentId(indexConnection, function(err, id)
    {
        if(!err)
        {
            if(id != null && typeof id != "undefined")
            {
                indexConnection.moreLikeThis(
                    IndexConnection.indexTypes.resource, //search in all graphs for resources (generic type)
                    id,
                    function(err, results)
                    {
                        if(!err)
                        {
                            let retrievedResources = Resource.restoreFromIndexResults(results);

                            retrievedResources = _.filter(retrievedResources, function(resource){
                                return resource.uri !== self.uri;
                            });

                            callback(0, retrievedResources);
                        }
                        else
                        {
                            callback(1, [results]);
                        }
                    }
                );
            }
            else
            {
                //document is not indexed, therefore has no ID. return empty array as list of similar resources.
                callback(null, []);
            }
        }
        else
        {
            callback(1, "Error retrieving similar resources for resource " + self.uri + " : " + id);
        }
    });
};

Resource.findResourcesByTextQuery = function (
    indexConnection,
    queryString,
    resultSkip,
    maxResultSize,
    callback)
{
    const queryObject = {
        "query": {
            "match": {
                "descriptors.object": {
                    "query": queryString
                }
            }
        },
        "from": resultSkip,
        "size": maxResultSize,
        "sort": [
            "_score"
        ],
        "version" : true
    };

    //var util = require('util');
    //util.debug("Query in JSON : " + util.inspect(queryObject));

    indexConnection.search(
        IndexConnection.indexTypes.resource, //search in all graphs for resources (generic type)
        queryObject,
        function(err, results)
        {
            if(!err)
            {
                let retrievedResources = Resource.restoreFromIndexResults(results);
                callback(0, retrievedResources);
            }
            else
            {
                callback(1, [results]);
            }
        }
    );
}

Resource.restoreFromIndexResults = function(hits)
{
    var results = [];

    if(hits != null && hits.length > 0)
    {
        for(var i = 0; i < hits.length; i++)
        {
            var hit = hits[i];

            var newResult = new Resource({});
            newResult.loadFromIndexHit(hit);

            results.push(newResult);
        }
    }

    return results;
};

Resource.prototype.restoreFromIndexDocument = function(indexConnection, callback)
{
    let self = this;

    //fetch document from the index that matches the current resource
    const queryObject = {
        "query" : {
            "filtered" : {
                "query" : {
                    "match_all" : {}
                },
                "filter" : {
                    "term" : {
                        "resource.uri" : self.uri
                    }
                }
            }
        },
        "from": 0,
        "size": 2,
        "sort": [
            "_score"
        ],
        "version" : true
    };

    indexConnection.search(
        IndexConnection.indexTypes.resource, //search in all graphs for resources (generic type)
        queryObject,
        function(err, hits)
        {
            if(!err)
            {
                let id = null;

                if(hits != null && hits instanceof Array && hits.length > 0)
                {
                    if(hits.length > 1)
                    {
                        console.error("Duplicate document in index detected for resource !!! Fix it " + self.uri);
                    }

                    let hit = hits[0];
                    self.loadFromIndexHit(hit);
                }

                callback(0, self);
            }
            else
            {
                callback(1, [hits]);
            }
        }
    );
}

/**
 * Will fetch all the data pertaining a resource from the last saved information
 * @param uri Uri of the resource to fetch
 * @param callback callback function
 */

Resource.findByUri = function(uri, callback, allowedGraphsArray, customGraphUri, skipCache, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval)
{
    var self = this;
    var getFromCache = function (uri, callback)
    {
        redis(customGraphUri).connection.get(uri, function(err, result)
        {
            if (!err)
            {
                if (result != null)
                {
                    var resource = Object.create(self.prototype);

                    resource.uri = uri;

                    //initialize all ontology namespaces in the new object as blank objects
                    // if they are not already present
                    resource.copyOrInitDescriptors(result);

                    if(descriptorTypesToRemove != null && descriptorTypesToRemove instanceof Array)
                    {
                        resource.clearDescriptors(descriptorTypesToRemove, descriptorTypesToExemptFromRemoval);
                    }

                    callback(err, resource);
                }
                else
                {
                    callback(null, null);
                }
            }
            else
            {
                callback(err)
            }
        });
    };


    var saveToCache = function(uri, resource, callback)
    {
        redis(customGraphUri).connection.put(uri, resource, function (err) {
            if(!err)
            {
                if(typeof callback === "function")
                {
                    callback(null, resource);
                }
            }
            else
            {
                var msg = "Unable to set value of " + resource.uri + " as " + JSON.stringify(resource) + " in cache : " + JSON.stringify(err);
                console.log(msg);
            }
        });
    };

    var getFromTripleStore = function(uri, callback, customGraphUri)
    {
        var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;

        if (uri instanceof Object && uri.uri != null)
        {
            uri = uri.uri;
        }

        if (allowedGraphsArray != null && allowedGraphsArray instanceof Array)
        {
            var ontologiesArray = allowedGraphsArray;
        }
        else
        {
            var ontologiesArray = Ontology.getAllOntologiesUris();
        }

        Resource.exists(uri, function(err, exists){
            if(!err)
            {
                if(exists)
                {
                    var resource = Object.create(self.prototype);
                    //initialize all ontology namespaces in the new object as blank objects
                    // if they are not already present

                    resource.uri = uri;

                    /**
                     * TODO Handle the edge case where there is a resource with the same uri in different graphs in Dendro
                     */
                    resource.loadPropertiesFromOntologies(ontologiesArray, function (err, loadedObject)
                    {
                        if (!err)
                        {
                            resource.baseConstructor(loadedObject);
                            callback(null, resource);
                        }
                        else
                        {
                            var msg = "Error " + resource + " while trying to retrieve resource with uri " + uri + " from triple store.";
                            console.error(msg);
                            callback(1, msg);
                        }
                    }, customGraphUri);
                }
                else
                {
                    if(Config.debug.resources.log_missing_resources)
                    {
                        var msg = uri + " does not exist in Dendro.";
                        console.log(msg);
                    }

                    callback(0, null);
                }
            }
            else
            {
                var msg = "Error " + exists + " while trying to check existence of resource with uri " + uri + " from triple store.";
                console.error(msg);
                callback(1, msg);
            }
        }, customGraphUri);
    };


    if(Config.cache.active)
    {
        async.waterfall([
            function(cb)
            {
                getFromCache(uri, function(err, object)
                {
                    cb(err, object);
                });
            },
            function(object, cb)
            {
                if(object != null)
                {
                    var resource = Object.create(self.prototype);
                    resource.uri = uri;

                    resource.copyOrInitDescriptors(object);

                    cb(null, resource);
                }
                else
                {
                    getFromTripleStore(uri, function(err, object)
                    {
                        if(!err)
                        {
                            saveToCache(uri, object);
                            cb(err, object);
                        }
                        else
                        {
                            var msg = "Unable to get resource with uri " + uri + " from triple store."
                            console.error(msg);
                            console.error(err);
                        }
                    }, customGraphUri);
                }
            }
        ], function(err, result){
            callback(err, result);
        });
    }
    else
    {
        getFromTripleStore(uri, function(err, result){
            callback(err, result);
        }, customGraphUri);
    }
};

Resource.prototype.loadFromIndexHit = function(hit)
{
    if(this.indexData == null)
    {
        this.indexData = {};
    }

    this.indexData.id = hit._id;
    this.indexData.indexId = hit._id;
    this.indexData.score = hit._score;
    this.uri = hit._source.uri;
    this.indexData.graph = hit._source.graph;
    this.indexData.last_indexing_date = hit._source.last_indexing_date;
    this.indexData.descriptors = hit._source.descriptors;

    return this;
};

Resource.prototype.insertDescriptors = function(newDescriptors, callback, customGraphUri)
{
    var self = this;
    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    db.connection.insertDescriptorsForSubject(self.uri, newDescriptors, graphUri, function(err, result)
    {
        callback(err, result);
    });
};

Resource.prototype.getArchivedVersions = function(offset, limit, callback, customGraphUri)
{
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var query =
        "WITH [0] \n" +
        "SELECT ?uri ?version_number\n" +
        "WHERE \n" +
        "{ \n" +
            "?uri rdf:type ddr:ArchivedResource. \n" +
            "?uri ddr:isVersionOf [1]. \n" +
            "?uri ddr:versionNumber ?version_number. \n" +
        "}\n" +
        "ORDER BY DESC(?version_number)\n";

    if(limit != null && limit > 0)
    {
        query = query + " LIMIT " + limit  + "\n";
    }

    if(offset != null && offset> 0)
    {
        query = query + " OFFSET " + limit + "\n";
    }

    db.connection.execute(query,
        [
            {
                value : graphUri,
                type : DbConnection.resourceNoEscape
            },
            {
                value : self.uri,
                type : DbConnection.resource
            }
        ], function(err, versions)
        {
            if(!err)
            {
                var getVersionContents = function(versionRow, cb)
                {
                    var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
                    ArchivedResource.findByUri(versionRow.uri, function(err, archivedResource)
                    {
                        cb(err, archivedResource)
                    }, null, customGraphUri);
                };

                async.map(versions, getVersionContents, function(err, formattedVersions)
                {
                    if(!err)
                    {
                        callback(null, formattedVersions);
                    }
                    else
                    {
                        var error = "Error occurred fetching data about a past version of resource " + self.uri + ". Error returned : " + formattedVersions;
                        console.error(error);
                        callback(1, error);
                    }
                });
            }
            else
            {
                var error = "Error occurred fetching versions of resource " + self.uri + ". Error returned : " + versions;
                console.error(error);
                callback(1, error);
            }
        });
}

Resource.prototype.getLatestArchivedVersion = function(callback)
{
    var self = this;
    self.getArchivedVersions(0, 1, function(err, latestRevisionArray){
        if(!err && latestRevisionArray instanceof Array && latestRevisionArray.length == 1)
        {
            callback(0, latestRevisionArray[0]);
        }
        else if(!err && latestRevisionArray instanceof Array && latestRevisionArray.length == 0)
        {
            callback(0, null);
        }
        else
        {
            var error = "Error occurred fetching latest version of resource " + self.uri + ". Error returned : " + latestRevisionArray;
            console.error(error);
            callback(1, error);
        }
    });
}

Resource.prototype.makeArchivedVersion = function(entitySavingTheResource, callback)
{
    var self = this;
    self.getLatestArchivedVersion(function(err, latestArchivedVersion)
    {
        if(!err)
        {
            if(latestArchivedVersion == null)
            {
                var newVersionNumber = 0;
            }
            else
            {
                var newVersionNumber = latestArchivedVersion.ddr.versionNumber + 1;
            }

            var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;

            //create a clone of the object parameter (note that all functions of the original object are not cloned,
            // but we dont care in this case
            // (http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object)
            var objectValues = JSON.parse(JSON.stringify(self));
            var archivedResource = new ArchivedResource(objectValues);

            if(self.uri != null)
            {
                archivedResource.uri = self.uri + "/version/" + newVersionNumber;
                archivedResource.ddr.isVersionOf = self.uri;
            }

            //TODO for testing only, in production should require authentication (an user in the current session) to perform an update.
            var versionCreator;
            if(entitySavingTheResource != null)
            {
                versionCreator = entitySavingTheResource;
            }
            else
            {
                var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                versionCreator = User.anonymous.uri;
            }

            archivedResource.ddr.versionCreator = versionCreator;
            archivedResource.ddr.isVersionOf = self.uri;
            archivedResource.ddr.versionNumber = newVersionNumber;

            callback(null, archivedResource);
        }
        else
        {
            var error = "Error occurred creating a new archived version of resource " + self.uri + ". Error returned : " + latestArchivedVersion;
            console.error(error);
            callback(1, error);
        }
    });
}

var groupPropertiesArrayIntoObject = function(results)
{
    var properties = null;

    if(results.length > 0 )
    {
        properties = {};

        for(var i = 0; i < results.length; i++)
        {
            var result = results[i];
            if(properties[result.property] == null)
            {
                properties[result.property] = [];
            }

            properties[result.property].push(decodeURI(result.object));
        }
    }

    return properties;
};

Resource.prototype.getDescriptors = function(descriptorTypesNotToGet, descriptorTypesToForcefullyGet)
{
    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
    var self = this;
    var descriptorsArray = [];

    for (var prefix in Elements)
    {
        for(var shortName in Elements[prefix])
        {
            if(self[prefix] != null)
            {
                var descriptorValue = self[prefix][shortName];
            }

            if(descriptorValue != null)
            {
                var newDescriptor = new Descriptor(
                    {
                        prefix : prefix,
                        shortName : shortName,
                        value : descriptorValue
                    }
                );

                if(newDescriptor.isAuthorized(descriptorTypesNotToGet, descriptorTypesToForcefullyGet))
                {
                    descriptorsArray.push(newDescriptor);
                }
            }
        }
    }

    return descriptorsArray;
}

/**
 * Calculates the differences between the data objects in this resource and the one supplied as an argument
 * @param anotherResource
 */
Resource.prototype.calculateDescriptorDeltas = function(newResource, descriptorsToExclude)
{
    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
    var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;

    var self = this;
    var deltas = [];

    var ontologies = Ontology.getAllOntologyPrefixes();
    var changeIndex = 0;

    var instanceOfBaseType = function(value)
    {
        return (typeof value == "string" || typeof value == "boolean" || typeof value == "number");
    }

    var pushDelta = function(deltas, prefix, shortName, oldValue, newValue, changeType, changeIndex)
    {
        var d = new Descriptor(
            {
                prefix : prefix,
                shortName : shortName
            }
        );

        if(descriptorsToExclude != null)
        {
            for(var i = 0; i < descriptorsToExclude.length; i++)
            {
                var descriptorType = descriptorsToExclude[i];
                if(d[descriptorType])
                {
                    return deltas;
                }
            }
        }

        var Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;

        var newChange = new Change({
            ddr :
            {
                changedDescriptor : d.uri,
                oldValue : left,
                newValue : right,
                changeType : changeType,
                changeIndex : changeIndex
            }
        });

        deltas = deltas.concat([newChange]);
        return deltas;
    }

    for(var i = 0; i < ontologies.length; i++)
    {
        var prefix = ontologies[i];
        var descriptors = Elements[prefix];

        for(var descriptor in descriptors)
        {
            /*
            left = current
            right = new
             */
            var left = self[prefix][descriptor];
            var right = newResource[prefix][descriptor];

            if(left == null && right != null)
            {
                deltas = pushDelta(deltas, prefix, descriptor, left, right, "add", changeIndex++);
            }
            else if(left != null && right == null)
            {
                deltas = pushDelta(deltas, prefix, descriptor, left, right, "delete", changeIndex++);
            }
            else if(left != null && right != null)
            {
                if(instanceOfBaseType(right) && left instanceof Array)
                {
                    var intersection = _.intersection([right], left);

                    if(intersection.length == 0)
                    {
                        deltas = pushDelta(deltas, prefix, descriptor, left, right, "delete_edit", changeIndex++);
                    }
                    else
                    {
                        deltas = pushDelta(deltas, prefix, descriptor, left, right, "delete", changeIndex++);
                    }
                }
                else if(right instanceof Array && instanceOfBaseType(left))
                {
                    var intersection = _.intersection([left], right);

                    if(intersection.length == 0)
                    {
                        deltas = pushDelta(deltas, prefix, descriptor, left, right, "add_edit", changeIndex++);
                    }
                    else
                    {
                        deltas = pushDelta(deltas, prefix, descriptor, left, right, "add", changeIndex++);
                    }

                }
                else if(instanceOfBaseType(left) && instanceOfBaseType(right))
                {
                    if(!(left === right))
                    {
                        deltas = pushDelta(deltas, prefix, descriptor, left, right, "edit", changeIndex++);
                    }
                }
                else if(left instanceof Array && right instanceof Array)
                {
                    if(left.length == right.length)
                    {
                        var intersection = _.intersection(right, left);

                        if(intersection.length != left.length || intersection.length != right.length)
                        {
                            deltas = pushDelta(deltas, prefix, descriptor, left, right, "edit", changeIndex++);
                        }
                    }
                    else if(left.length < right.length)
                    {
                        var intersection = _.intersection(right, left);

                        if(intersection.length < left.length)
                        {
                            deltas = pushDelta(deltas, prefix, descriptor, left, right, "add_edit", changeIndex++);
                        }
                        else
                        {
                            deltas = pushDelta(deltas, prefix, descriptor, left, right, "add", changeIndex++);
                        }
                    }
                    else if(left.length > right.length)
                    {
                        var intersection = _.intersection(right, left);

                        if(intersection.length < right.length)
                        {
                            deltas = pushDelta(deltas, prefix, descriptor, left, right, "delete_edit", changeIndex++);
                        }
                        else
                        {
                            deltas = pushDelta(deltas, prefix, descriptor, left, right, "delete", changeIndex++);
                        }
                    }
                }
            }
        }
    }

    return deltas;
};


Resource.prototype.checkIfHasPredicateValue = function(predicateInPrefixedForm, value, callback, customGraphUri)
{
    var self = this;
    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var descriptorToCheck = new Descriptor({
        prefixedForm : predicateInPrefixedForm,
        value : value
    });

    if(descriptorToCheck instanceof Descriptor)
    {
        var checkInTripleStore = function(callback)
        {
            var query =
                "WITH [0] \n" +
                "ASK {" +
                "[1] [2] [3] ." +
                "} \n";

            db.connection.execute(query,
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : DbConnection.resource,
                        value : self.uri
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : descriptorToCheck.uri
                    },
                    {
                        type : descriptorToCheck.type,
                        value : value
                    }
                ],
                function(err, result) {
                    if(!err)
                    {
                        if(result == true)
                        {
                            callback(0, true);
                        }
                        else
                        {
                            callback(0, false);
                        }
                    }
                    else
                    {
                        var msg = "Error verifying existence of triple \"" + self.uri + " " + predicateInPrefixedForm + " " + value + "\". Error reported " + JSON.stringify(result);
                        if(Config.debug.resources.log_all_type_checks == true)
                        {
                            console.error(msg);
                        }
                        callback(1, msg);
                    }
                });
        };

        redis(customGraphUri).connection.get(self.uri, function(err, cachedDescriptor){
           if(!err && cachedDescriptor != null)
           {
               var namespace = descriptorToCheck.getNamespacePrefix();
               var element = descriptorToCheck.getShortName();
               if(
                   cachedDescriptor[namespace] != null &&
                   cachedDescriptor[namespace][element] != null &&
                   cachedDescriptor[namespace][element] === value)
               {
                   callback(null, true);
               }
               else
               {
                  checkInTripleStore(callback);
               }
           }
           else
           {
               checkInTripleStore(callback);
           }
        });
    }
    else
    {
        console.error("Attempting to check the value of an unknown descriptor "+ predicateInPrefixedForm + " for resource " + self.uri);
        return false;
    }
}

Resource.prototype.restoreFromArchivedVersion = function(version, callback, uriOfUserPerformingRestore)
{
    var self = this;

    var typesToExclude = [
        Config.types.locked,
        Config.types.audit,
        Config.types.private
    ];

    var oldDescriptors = version.getDescriptors(typesToExclude);

    self.replaceDescriptors(oldDescriptors, typesToExclude);

    self.save(
        callback,
        true,
        uriOfUserPerformingRestore,
        [
            Config.types.locked
        ]);
};


Resource.prototype.findMetadataRecursive = function(callback){
    var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
    var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;

    var self = this;
    Resource.findByUri(self.uri, function(err, resource){
        if(!err){
            if(resource != null)
            {
                resource.getPropertiesFromOntologies(
                    Ontology.getPublicOntologiesUris(),
                    function(err, descriptors)
                    {
                        if(!err)
                        {
                            //remove locked descriptors
                            for(var i = 0 ; i < descriptors.length ; i++)
                            {
                                if(descriptors[i].locked)
                                {
                                    descriptors.splice(i, 1);
                                }
                            }

                            Folder.findByUri(resource.uri, function(err, folder) {
                                var metadataResult = {
                                    title: resource.nie.title,
                                    descriptors: descriptors,
                                    metadata_quality: folder.ddr.metadataQuality|0,
                                    file_extension: resource.ddr.fileExtension,
                                    hasLogicalParts : []
                                };
                                if(!err){

                                    folder.getLogicalParts(function (err, children) {
                                        if (!err) {
                                            var _ = require('underscore');
                                            children = _.reject(children, function (child) {
                                                return child.ddr.deleted;
                                            });

                                            if (children.length > 0) {

                                                var async = require("async");

                                                // 1st parameter in async.each() is the array of items
                                                async.each(children,
                                                    // 2nd parameter is the function that each item is passed into
                                                    function(child, callback){
                                                        // Call an asynchronous function
                                                        child.findMetadataRecursive( function (err, result2) {
                                                            if (!err) {
                                                                metadataResult.hasLogicalParts.push(result2);
                                                                callback(null);
                                                            }
                                                            else {
                                                                console.info("[findMetadataRecursive] error accessing metadata of resource " + folder.nie.title);
                                                                callback(err);
                                                            }
                                                        });
                                                    },
                                                    // 3rd parameter is the function call when everything is done
                                                    function(err){
                                                        if(!err) {
                                                            // All tasks are done now
                                                            callback(false, metadataResult);
                                                        }
                                                        else{
                                                            callback(true, null);
                                                        }
                                                    }
                                                );
                                            }
                                            else {
                                                callback(false, metadataResult);
                                            }
                                        }
                                        else {
                                            console.info("[findMetadataRecursive] error accessing logical parts of folder " + folder.nie.title);
                                            callback(true, null);
                                        }
                                    });
                                }
                                else {
                                    console.info("[findMetadataRecursive] " + folder.nie.title + " is not a folder.");
                                    callback(false, metadataResult);
                                }

                            });
                        }
                        else
                        {

                            console.error("[findMetadataRecursive] error accessing properties from ontologies in " + self.uri)

                            callback(true, [descriptors]);
                        }
                    });
            }
            else
            {
                var msg = self.uri + " does not exist in Dendro.";
                console.error(msg);

                callback(true, msg);
            }
        }
        else
        {
            var msg = "Error fetching " + self.uri + " from the Dendro platform.";
            console.error(msg);

            callback(true, msg);
        }
    });
};

Resource.prototype.isOfClass = function(classNameInPrefixedForm, callback)
{
    var self = this;
    self.checkIfHasPredicateValue("rdf:type", classNameInPrefixedForm, function(err, isOfClass){
        if(Config.debug.active && Config.debug.resources.log_all_type_checks)
        {
            if(isOfClass)
            {
                console.log("Resource " + self.uri + " IS of type " + classNameInPrefixedForm);
            }
            else
            {
                console.log("Resource " + self.uri + " IS NOT of type " + classNameInPrefixedForm);
            }
        }
        callback(err, isOfClass);
    });
};

Resource.prototype.toCSVLine = function(existingHeaders)
{
    var self = this;

    var flatDescriptors = self.getDescriptors();

    if(existingHeaders instanceof Object && Object.keys(existingHeaders).length == 0)
    {
        var headers = {
            uri : 0
        };
    }
    else
    {
        var headers = JSON.parse(JSON.stringify(existingHeaders));
    }

    /*Update header positions*/
    for(var i = 0; i < flatDescriptors.length; i++)
    {
        var descriptor = flatDescriptors[i];
        var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;
        if(headers[descriptorPrefixedEscaped] == null)
        {
            headers[descriptorPrefixedEscaped] = Object.keys(headers).length;
        }
    }

    /*Write value in the right column, according to header*/

    var descriptorLine =  new Array(headers.length);

    descriptorLine[headers['uri']] = self.uri;

    for(var i = 0; i < flatDescriptors.length; i++)
    {
        var descriptor = flatDescriptors[i];
        var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;
        var columnIndex = headers[descriptorPrefixedEscaped];
        descriptorLine[columnIndex] = descriptor.value;
    }

    /**Convert CSV Columns Array to string**/

    var csvLine = '';
    for(var i = 0; i < descriptorLine.length; i++)
    {
        csvLine = csvLine + descriptorLine[i];
        if(i < descriptorLine.length - 1)
        {
            csvLine = csvLine + ',';
        }
    }

    csvLine = csvLine + "\n";

    return {
        csv_line: csvLine,
        headers : headers
    };
};

Resource.randomInstance = function(typeInPrefixedFormat, callback, customGraphUri) {
    var self = this;

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    async.waterfall([
        function(callback) {
            db.connection.execute(
                    "SELECT (count(?s) as ?c) \n" +
                    "FROM [0] \n" +
                    "WHERE \n" +
                    "{ \n" +
                        "?s ?p ?o . \n" +
                        "?s rdf:type [1] \n" +
                        " FILTER NOT EXISTS " +
                        "{ \n"+
                        "   ?s ddr:isVersionOf ?version .\n" +
                        "} \n"+
                    "}\n",
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : typeInPrefixedFormat
                    }
                ],
                function(err, results) {
                    if(!err)
                    {
                        var randomNumber = Math.floor(Math.random() * (results[0].c - 1));
                        callback(null, randomNumber);
                    }
                    else
                    {
                        callback(err, results);
                    }
                });
        },
        function(randomNumber,callback) {
            db.connection.execute(
                "SELECT ?s \n"+
                "FROM [0] \n"+
                "WHERE \n" +
                "{ \n" +
                    "?s ?p ?o . \n" +
                    "?s rdf:type [2] \n" +
                    " FILTER NOT EXISTS " +
                    "{ \n"+
                    "   ?s ddr:isVersionOf ?version .\n" +
                    "} \n"+
                "} \n" +
                "ORDER BY ?s \n" +
                "OFFSET [1] \n" +
                "LIMIT 1 \n",
            [
                {
                    type : DbConnection.resourceNoEscape,
                    value : graphUri
                },
                {
                    type: DbConnection.int,
                    value: randomNumber
                },
                {
                    type : DbConnection.prefixedResource,
                    value : typeInPrefixedFormat
                }
            ],
            function(err, result) {
                if(!err)
                {
                    var randomResourceUri = result[0].s;
                    self.findByUri(randomResourceUri, function(err, result){
                        callback(err, result);
                    });
                }
                else
                {
                    callback(err, null);
                }
            });
        }
    ], function(err, randomResourceInstance){
        callback(err, randomResourceInstance);
    });
};

Resource.deleteAllWithCertainDescriptorValueAndTheirOutgoingTriples = function(descriptor, callback, customGraphUri)
{
    var async = require('async');
    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var pagedFetchResourcesWithDescriptor = function(descriptor, page, pageSize, callback)
    {
        var offset = pageSize * page;

        db.connection.execute(
            "WITH [0] \n" +
            "SELECT ?uri \n" +
            "WHERE \n" +
            "{ \n" +
            "   ?uri [1] [2] \n" +
            "} \n" +
            "LIMIT [3] \n" +
            "OFFSET [4] \n",
            [
                {
                    type : DbConnection.resourceNoEscape,
                    value : graphUri
                },
                {
                    type : DbConnection.prefixedResource,
                    value : descriptor.getPrefixedForm()
                },
                {
                    type : descriptor.type,
                    value : descriptor.value
                },
                {
                    type : DbConnection.int,
                    value : pageSize
                },
                {
                    type : DbConnection.int,
                    value : offset
                }
            ],
            function(err, result)
            {
                callback(err, result);
            }
        );
    };

    var deleteAllCachedResourcesWithDescriptorValue = function(descriptor, page, pageSize, callback)
    {
        pagedFetchResourcesWithDescriptor(descriptor, page, pageSize, function(err, results){
            if(!err)
            {
                if(results instanceof Array)
                {
                    var resourceUris = [];
                    for(var i = 0; i < results.length; i++)
                    {
                        resourceUris.push(results[i].uri);
                    }

                    if(resourceUris.length > 0)
                    {
                        redis(customGraphUri).connection.delete(resourceUris, function(err, result){
                            if(!err)
                            {
                                if(resourceUris.length === pageSize)
                                {
                                    page++;
                                    deleteAllCachedResourcesWithDescriptorValue(descriptor, page, pageSize, callback);
                                }
                                else
                                {
                                    callback(null, null);
                                }
                            }
                            else
                            {
                                callback(err, result);
                            }

                        });
                    }
                    else
                    {
                        callback(null, null);
                    }
                }
                else
                {
                    callback(1, "Unable to delete resources with descriptor "+ descriptor.getPrefixedForm() +  " and value" + descriptor.value + " from cache.");
                }
            }
        });
    };

    //TODO CACHE DONE

    deleteAllCachedResourcesWithDescriptorValue(descriptor, 0, Config.limits.db.pageSize, function(err){
        if(!err)
        {
            db.connection.execute(
                "WITH [0]\n"+
                "DELETE \n" +
                "WHERE \n" +
                "{ \n" +
                "   ?s [1] [2]. \n" +
                "   ?s ?p ?o \n" +
                "} \n",

                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : DbConnection.prefixedResource,
                        value : descriptor.getPrefixedForm()
                    },
                    {
                        type : descriptor.type,
                        value : descriptor.value
                    }
                ],
                function(err, results) {
                    if(!err)
                    {
                        callback(null, results);
                    }
                    else
                    {
                        var msg = "Error deleting all resources of type with descriptor "+ descriptor.getPrefixedForm() +  " and value" + descriptor.value + " and their outgoing triples. Error returned: " + JSON.stringify(results);
                        console.error(msg);
                        callback(err, msg);
                    }
                });
        }
        else
        {
            var msg = "Error deleting all CACHED resources of type with descriptor "+ descriptor.getPrefixedForm() +  " and value" + descriptor.value +" and their outgoing triples. Error returned: " + JSON.stringify(results);
            console.error(msg);
            callback(err, msg);
        }
    });


};


Resource.prototype.deleteAllOfMyTypeAndTheirOutgoingTriples = function(callback, customGraphUri)
{
    var self = this;
    var type = self.rdf.type;

    self.uri = object.uri;
    self.prefix = self.getNamespacePrefix();
    self.ontology = self.getOwnerOntologyUri();
    self.shortName = self.getShortName();
    self.prefixedForm = self.getPrefixedForm();

    var typeDescriptor = new Descriptor(
        {
            prefixedForm : "rdf:type",
            value : type
        }
    );

    Resource.deleteAllWithCertainDescriptorValueAndTheirOutgoingTriples(typeDescriptor, callback, customGraphUri);
};


Resource.arrayToCSVFile = function(resourceArray, fileName, callback)
{
    var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

    File.createBlankTempFile(fileName, function(err, tempFileAbsPath){
        callback(err, tempFileAbsPath);

        /*var fs = require('fs');

         //clear file
         fs.writeFile(tempFileAbsPath, '', function(){

         //write to file

         var writeCSVLineToFile = function(resource, cb)
         {
         var csvLine = resource.toCSVLine();
         fs.appendFile(tempFileAbsPath, csvLine, cb);
         };

         async.map(resourceArray, writeCSVLineToFile, function(err, results){
         callback(err, tempFileAbsPath);
         });
         }); */
    });
};

Resource.exists = function(uri, callback, customGraphUri)
{
    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    db.connection.execute(
        "WITH [0]\n"+
        "ASK \n" +
        "WHERE \n" +
        "{ \n" +
        "   {\n" +
        "       [1] ?p ?o. \n" +
        "   }\n" +
        "} \n",

        [
            {
                type : DbConnection.resourceNoEscape,
                value : graphUri
            },
            {
                type : DbConnection.resource,
                value : uri
            }
        ],
        function(err, result) {
            if(!err)
            {
                callback(null, result);
            }
            else
            {
                var msg = "Error checking for the existence of resource with uri : " + uri;
                console.error(msg);
                callback(err, msg);
            }
        });
}


Resource.getCount = function(callback) {
    var self = this;
    var countQuery =
        "SELECT " +
        "COUNT(?uri) as ?count " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type [1] " +
        "}";

    var totalCount;

    db.connection.execute(countQuery,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.prefixedResource,
                value: self.prefixedRDFType
            }
        ],

        function(err, count) {
            if(!err && count instanceof Array)
            {
                totalCount = parseInt(count[0].count);
                callback(null, totalCount);
            } else{
                callback(err, count[0]);
            }
        }
    );
}


Resource = Class.extend(Resource, Class);

module.exports.Resource = Resource;
