var Config = require("../meta/config.js").Config;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Elements = require(Config.absPathInSrcFolder("/models/meta/elements.js")).Elements;
var ResearchDomain = require(Config.absPathInSrcFolder("/models/meta/research_domain.js")).ResearchDomain;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();

var _ = require('underscore');
var async = require('async');

function Ontology (object)
{
    var self = this;
    if(object != null && object instanceof Object)
    {
        if(object.uri != null && object.prefix == null)
        {
            var allOntologies = Ontology.getAllOntologiesArray();
            for(var i = 0; i < allOntologies.length; i++)
            {
                var ontology = allOntologies[i];

                if(ontology.uri == object.uri)
                {
                    self.prefix = ontology.prefix;

                    if(Ontology.allOntologies[self.prefix] != null)
                    {
                        self.prefix = Ontology.allOntologies[self.prefix].prefix;
                        self.uri = Ontology.allOntologies[self.prefix].uri;
                        self.elements = Ontology.allOntologies[self.prefix].elements;
                    }
                }
            }
        }
        else if(object.prefix != null)
        {
            if(Ontology.allOntologies[object.prefix] != null)
            {
                self.prefix = Ontology.allOntologies[object.prefix].prefix;
                self.uri = Ontology.allOntologies[object.prefix].uri;
                self.elements = Ontology.allOntologies[object.prefix].elements;
            }
        }

        if(object.description != null)
        {
            self.description = object.description;
        }

        if(object.domain != null)
        {
            self.domain = object.domain;
        }
    }

    return self;
}

Ontology.findByUri = function(uri, callback)
{
    var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

    Resource.findByUri(uri, function(err, ontology){

        if(!err)
        {
            if(ontology != null)
            {
                var newOntology = new Ontology({
                    prefix : ontology.ddr.hasPrefix,
                    uri : ontology.uri,
                    description : ontology.dcterms.description,
                    domain : ontology.ddr.hasResearchDomain
                });
            }
            else
            {
                callback(null, null);
            }
        }


        callback(err, newOntology);
    });
};

Ontology.all = function(callback)
{
    var query =
        "WITH [0] \n" +
        "SELECT ?uri \n" +
        "WHERE { \n" +
        "   ?uri rdf:type ddr:Ontology . \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            }
        ],
        function(err, results)
        {
            if (!err)
            {
                var getOntology = function (ontologyResult, callback)
                {
                    Ontology.findByUri(ontologyResult.uri, callback)
                };

                async.map(results, getOntology, function(err, allOntologies){
                    callback(err, allOntologies);
                });
            }
        });
};

Ontology.initAllFromDatabase = function(callback)
{
    console.log("(Re) Loading ontology configurations from database...");

    var getFullResearchDomain = function(researchDomainUri, callback)
    {
        ResearchDomain.findByUri(researchDomainUri, callback);
    };

    var addResearchDomainsDetails = function(ontology, callback)
    {
        if(ontology.domain instanceof Array)
        {
            async.map(ontology.domain, getFullResearchDomain, function(err, results)
            {
                if(!err)
                {
                    ontology.domain = results;
                }

                callback(err, ontology);
            });
        }
        else if(typeof ontology.domain === "string")
        {
            async.map([ontology.domain], getFullResearchDomain, function(err, results)
            {
                if(results != null)
                {
                    ontology.domain = results;
                }

                callback(err, ontology);
            });
        }
        else
        {
            callback(null, ontology);
        }
    };

    var addValidationData = function(ontology, callback)
    {
        var getAlternativesForDescriptor = function(elementUri, callback)
        {
            db.connection.execute(
                "WITH [0] \n" +
                "SELECT ?alternative \n" +
                "WHERE \n" +
                "{ \n" +
                "   [1] ddr:hasAlternative ?alternative\n" +
                "} \n",
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : ontology.uri
                    },
                    {
                        type : DbConnection.resourceNoEscape,
                        value : elementUri
                    }
                ],
                function(err, alternatives)
                {
                    if(!err)
                    {
                        if(alternatives.length == 0)
                        {
                            callback(null, null);
                        }
                        else
                        {
                            var results = [];

                            for(var i = 0; i < alternatives.length; i++)
                            {
                                results.push(alternatives[i].alternative);
                            }

                            callback(null, results);
                        }
                    }
                    else
                    {
                        console.error("Error retrieving valid alternatives for descriptor " + elementUri + "! Error returned " + JSON.stringify(alternatives));
                    }

                }
            );
        };

        var getRegexForDescriptor = function(elementUri, ontologyUri, callback)
        {
            db.connection.execute(
                "WITH [0] \n" +
                "SELECT ?regex \n" +
                "WHERE \n" +
                "{ \n" +
                "   [1] ddr:hasRegex ?regex\n" +
                "} \n",
                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : ontologyUri
                    },
                    {
                        type : DbConnection.resourceNoEscape,
                        value : elementUri
                    }
                ],
                function(err, regex)
                {
                    if(!err)
                    {
                        if(regex.length > 1)
                        {
                            console.error("There are two different Regular Expressions for validating element " + elementUri + "! Please review the ontology with URI " + ontologyUri + " and delete hasRegex annotation properties until there is only one.");
                            callback(1, null);
                        }
                        else
                        {
                            if(regex.length == 1)
                            {
                                callback(null, regex[0].regex);
                            }
                            else
                            {
                                callback(null, null);
                            }
                        }
                    }
                    else
                    {
                        console.error("Error retrieving Regular Expression that validates " + elementUri + "! Error returned " + JSON.stringify(regex));
                    }

                }
            );
        };

        if(ontology.elements != null)
        {
            async.map(
                Object.keys(ontology.elements),
                function(elementShortName, callback)
                {
                    var elementUri = Ontology.allOntologies[ontology.prefix].uri + elementShortName;
                    var element = ontology.elements[elementShortName];

                    async.waterfall([
                        function(callback)
                        {
                            getRegexForDescriptor(elementUri, ontology.uri, function(err, result)
                            {
                                if(!err)
                                {
                                    if(result != null)
                                    {
                                        element.hasRegex = result;
                                        element.control = Config.controls.regex_checking_input_box;
                                    }
                                }

                                callback(err, element);
                            });
                        }
                        ,
                        function(element, callback)
                        {
                            getAlternativesForDescriptor(elementUri, function(err, result){

                                if(!err)
                                {
                                    if(result != null)
                                    {
                                        element.hasAlternative = result;
                                        element.control = Config.controls.combo_box;
                                    }
                                }

                                callback(err, element);
                            });
                        }
                    ],
                    function(err, results)
                    {
                        callback(err, results);
                    });
                },
                function(err, results)
                {
                    callback(err, results);
                });
        }
    };

    var checkForOntology = function(ontologyObject, callback)
    {
        Ontology.findByUri(ontologyObject.uri, function(err, ontology){
            if(err)
            {
                console.log("Error occurred when searching for ontology with URI : " + ontologyObject.uri + ". Error description : " + JSON.stringify(ontology));
            }

            callback(err, ontology);
        });
    };

    var createOntologyRecordInDatabase = function(ontologyObject, callback)
    {
        var newOntology = new Ontology(ontologyObject);

        newOntology.save(function(err, result){
            callback(err, result);
        });
    };

    var recreateOntologiesInDatabase = function(ontologiesArray, callback)
    {
        async.map(ontologiesArray, function(ontologyObject, callback)
        {
            async.waterfall([
                    function(callback)
                    {
                        checkForOntology(ontologyObject, callback);
                    },
                    function (ontology, callback)
                    {
                        if(ontology == null)
                        {
                            createOntologyRecordInDatabase(ontologyObject, callback);
                        }
                        else
                        {
                            callback(null, null);
                        }
                    }
                ],
                function (err, results)
                {
                    callback(err, results);
                }
            );
        }, function(err, results){
            callback(err, results);
        });
    };

    var loadOntologyConfigurationsFromDatabase = function(callback)
    {
        Ontology.all(function(err, ontologies){
            if(!err)
            {
                async.waterfall(
                    [
                        function(callback){
                            async.map(ontologies, addResearchDomainsDetails, function(err, loadedOntologies){
                                if(!err)
                                {
                                    console.log("[INFO] Finished loading research domain configurations for descriptors from database");
                                }
                                callback(err, loadedOntologies);

                            });
                        },
                        function(loadedOntologies, callback){
                            async.map(loadedOntologies, addValidationData, function(err, loadedOntologies){
                                if(!err)
                                {
                                    console.log("[INFO] Finished loading validation information (Regex + alternatives) for the descriptors in the database");
                                }

                                callback(err, loadedOntologies);
                            });
                        }
                    ],
                    function(err, loadedOntologies)
                    {
                        if(!err)
                        {
                            callback(err, loadedOntologies);
                        }
                        else
                        {
                            callback(err, loadedOntologies);
                        }
                    }
                )
            }
            else
            {
                var msg = "[ERROR] Error loading ontology configurations from database: Unable to fetch all resources from the graph";
                console.log(msg);
                callback(1, msg);
            }
        });
    };


    async.series([
        function(callback)
        {
            recreateOntologiesInDatabase(Ontology.getAllOntologiesArray(), callback)
        },
        function(callback)
        {
            loadOntologyConfigurationsFromDatabase(callback)
        }
    ],
    function(err, results)
    {
        callback(err, results);
    });
};

Ontology.allOntologies = function()
{
    return GLOBAL.allOntologies;
}();

Ontology.getAllOntologyPrefixes = function()
{
    if(Ontology.allOntologyPrefixes == null)
    {
        Ontology.allOntologyPrefixes = [];
        var ontologies = Ontology.getAllOntologiesArray();

        for(var i = 0; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            Ontology.allOntologyPrefixes.push(ontology.prefix);
        }
    }

    return Ontology.allOntologyPrefixes;
};

Ontology.getAllOntologiesArray = function()
{
    Ontology.allOntologiesArray = [];

    for(var ontologyPrefix in Ontology.allOntologies)
    {
        if(Ontology.allOntologies.hasOwnProperty(ontologyPrefix))
        {
            var ontology = Ontology.allOntologies[ontologyPrefix];
            Ontology.allOntologiesArray.push(ontology);
        }
    }

    return Ontology.allOntologiesArray;
};

Ontology.getAllOntologiesUris = function()
{
    if(Ontology.ontologyUris == null)
    {
        var ontologies = Ontology.getAllOntologiesArray();

        Ontology.ontologyUris = [];

        for(var i = 0 ; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            Ontology.ontologyUris.push(ontology.uri);
        }
    }

    return Ontology.ontologyUris;
};

/**
 * Public ontologies
 * @returns {Array}
 */

Ontology.getPublicOntologyPrefixes = function()
{
    if(Ontology.publicOntologyPrefixes == null)
    {
        Ontology.publicOntologyPrefixes = [];

        var ontologies = Ontology.getAllOntologiesArray();

        for(var i = 0 ; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            if(!ontology.private)
            {
                Ontology.publicOntologyPrefixes.push(ontology.prefix);
            }
        }
    }

    return Ontology.publicOntologyPrefixes;
};

Ontology.getPublicOntologies = function()
{
    if(Ontology.publicOntologies == null)
    {
        Ontology.publicOntologies = [];

        var ontologies = Ontology.getAllOntologiesArray();
        for(var i = 0 ; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            if(!ontology.private)
            {
                Ontology.publicOntologies.push(ontology);
            }
        }
    }

    return Ontology.publicOntologies;
};

Ontology.getPublicOntologiesUris = function()
{
    if(Ontology.publicOntologyUris == null)
    {
        Ontology.publicOntologyUris = [];

        var ontologies = Ontology.getAllOntologiesArray();
        for(var i = 0 ; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            if(!ontology.private)
            {
                Ontology.publicOntologyUris.push(ontology.uri);
            }
        }
    }

    return Ontology.publicOntologyUris;
};

Ontology.getOntologyPrefix = function(ontologyUri)
{
    if(Ontology.ontologyPrefixesMatcher == null)
    {
        Ontology.ontologyPrefixesMatcher = {};

        var ontologies = Ontology.getAllOntologiesArray();

        for(var i = 0 ; i < ontologies.length; i++)
        {
            var ontology = ontologies[i];
            Ontology.ontologyPrefixesMatcher[ontology.uri] = ontology.prefix;
        }
    }

    return Ontology.ontologyPrefixesMatcher[ontologyUri];
};

Ontology.findByResearchDomainPrefixOrComment = function(query, maxNumberOfResults, callback)
{
    var results = [];

    var containsString = function(needle, haystack)
    {
        if(haystack == null)
        {
            return false;
        }
        else
        {
            var downcasedNeedle = needle.toLowerCase();
            var downcasedHaystack= haystack.toLowerCase();

            if(downcasedHaystack.indexOf(downcasedNeedle) > - 1)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

    }

    var containsResearchDomain = function(ontology, query)
    {
        if(ontology.domain == null || !(ontology.domain instanceof Array))
        {
            return false;
        }
        else
        {
            for(var i = 0; i < ontology.domain.length;i++)
            {
                var aDomain = ontology.domain[i];

                return containsString(query, aDomain.dcterms.description);
            }

        }
    };

    var ontologies = Ontology.getPublicOntologies();

    for(var i = 0; i < ontologies.length && results.length < maxNumberOfResults; i++)
    {
        var ontology = ontologies[i];

        if(ontology.description != null || ontology.prefix != null || (ontology.domain != null))
        {
            var typeOfDomain = typeof ontology.domain;
            if(typeOfDomain === "string")
            {
                ontology.domain = [ontology.domain];
            }

            if(
                containsString(query, ontology.description) ||
                containsString(query, ontology.prefix) ||
                containsResearchDomain(ontology, query)
                )
            {
                if(Config.debug.active && Config.debug.log_autocomplete_requests)
                {
                    console.log("Ontology " + ontology.uri + " CONTAINS THE TERM " + query + " !!!!!!!!!!!!!!!!!!!");
                }

                results.push(ontology);
            }
            else
            {
                if(Config.debug.active && Config.debug.log_autocomplete_requests)
                {
                    console.log("Ontology " + ontology.uri + " does not contain the term " + query);
                }
            }
        }
    }

    if(Config.debug.active && Config.debug.log_autocomplete_requests && results.length > 0)
    {
        console.log(JSON.stringify(results));
    }

    callback(null, results);
};

Ontology.prototype.save = function(callback)
{
    var self = this;
    var uri = self.uri;

    var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

    var description = new Descriptor(
        {
            prefixedForm: "dcterms:description",
            value: self.description
        });

    var domainsArray = [];

    if(self.domain != null && self.domain instanceof Array)
    {
        for(var i = 0; i < self.domain.length; i++)
        {
            domainsArray.push(self.domain[i].uri);
        }
    }

    var domain = new Descriptor(
        {
            prefixedForm: "ddr:hasResearchDomain",
            value: domainsArray
        });

    var type = new Descriptor({
        prefixedForm: "rdf:type",
        value : Ontology.prefixedRDFType
    });

    var prefix = new Descriptor({
        prefixedForm: "ddr:hasPrefix",
        value : self.prefix
    });

    var modified = new Descriptor({
        prefixedForm: "dcterms:modified",
        value : new Date().toISOString()
    });

    var newDescriptorsArray = [description, domain, type, prefix, modified];


    self.replaceDescriptorsInTripleStore(newDescriptorsArray, db.graphUri, function(err, result){
        if(!err)
        {
            callback(err, result);
        }
        else
        {
            var msg = "Unable to SAVE ontology with uri : " + uri + " because of error: " + result;
            console.error(msg);
            callback(err, msg);
        }
    });
};

Ontology.autocomplete_research_domains = function(query, callback)
{
    var query =
        "WITH [0] \n" +
        "SELECT * \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type ddr:Ontology . \n" +
        "   ?uri ddr:hasResearchDomain ?domain .\n" +
        "   FILTER regex(?domain, [1] , \"i\"). \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.string,
                value : query
            }
        ],
        function(err, results)
        {
            if (err)
            {
                var domains = [];
                for(var i = 0; i < results.length; i++)
                {
                    domains.push(results['domain']);
                }
            }

            callback(err, domains);
        });
};

Ontology.findByPrefix = function(prefix, callback)
{
    var prefixes = Object.keys(Ontology.allOntologies);

    //look first in memory, then go to the database if if fails.
    for (var i = 0; i < prefixes.length; i++)
    {
        var aPrefix = prefixes[i];
        if (aPrefix == prefix)
        {
            var result = { "uri" : Ontology.allOntologies[aPrefix].uri };
            var ontology = new Ontology(result);
            return callback(null, ontology);
        }
    }

    var query =
        "WITH [0] \n" +
        "SELECT * \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type ddr:Ontology . \n" +
        "   ?uri ddr:hasPrefix [1] \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.string,
                value: prefix
            }
        ],
        function (err, results)
        {
            if (!err && results != null)
            {
                if (results.length > 1)
                {
                    var msg = "[FATAL ERROR] More than one ontology registered for the same prefix in Dendro! There must be only one ontology with a given prefix! Prefix that has more than one ontology associated is : " + prefix;
                    console.error(msg);
                    callback(1, msg);
                }
                else if (results.length == 1)
                {
                    var newOntology = new Ontology(results[0]);
                    callback(null, newOntology);
                }
                else
                {
                    callback(null, null);
                }
            }
        });
};

Ontology.prefixedRDFType = "ddr:Ontology";

Ontology = Class.extend(Ontology, Resource);

module.exports.Ontology = Ontology;
