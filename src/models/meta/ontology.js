const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Elements = require(Config.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const ResearchDomain = require(Config.absPathInSrcFolder("/models/meta/research_domain.js")).ResearchDomain;
const Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return global.db.default;
}();

const _ = require('underscore');
const async = require('async');

function Ontology (object)
{
    const self = this;
    if(!isNull(object) && object instanceof Object)
    {
        if(!isNull(object.uri) && isNull(object.prefix))
        {
            const allOntologies = Ontology.getAllOntologiesArray();
            for(let i = 0; i < allOntologies.length; i++)
            {
                const ontology = allOntologies[i];

                if(ontology.uri === object.uri)
                {
                    self.prefix = ontology.prefix;

                    if(!isNull(Ontology.allOntologies[self.prefix]))
                    {
                        self.prefix = Ontology.allOntologies[self.prefix].prefix;
                        self.uri = Ontology.allOntologies[self.prefix].uri;
                        self.elements = Ontology.allOntologies[self.prefix].elements;
                    }
                }
            }
        }
        else if(!isNull(object.prefix))
        {
            if(!isNull(Ontology.allOntologies[object.prefix]))
            {
                self.prefix = Ontology.allOntologies[object.prefix].prefix;
                self.uri = Ontology.allOntologies[object.prefix].uri;
                self.elements = Ontology.allOntologies[object.prefix].elements;
            }
        }

        if(!isNull(object.description))
        {
            self.description = object.description;
        }

        if(!isNull(object.domain))
        {
            self.domain = object.domain;
        }
    }

    return self;
}

Ontology.findByUri = function(uri, callback)
{
    const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

    Resource.findByUri(uri, function(err, ontology){

        if(!err)
        {
            if(!isNull(ontology))
            {
                const newOntology = new Ontology({
                    prefix: ontology.ddr.hasPrefix,
                    uri: ontology.uri,
                    description: ontology.dcterms.description,
                    domain: ontology.ddr.hasResearchDomain
                });
                
                return callback(null, newOntology);
            }
            else
            {
                return callback(null, null);
            }
        }
        else
        {
            return callback(err, ontology);
        }
    });
};

Ontology.all = function(callback)
{
    const query =
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
                const getOntology = function (ontologyResult, callback) {
                    Ontology.findByUri(ontologyResult.uri, callback)
                };

                async.map(results, getOntology, function(err, allOntologies){
                    return callback(err, allOntologies);
                });
            }
        });
};

Ontology.initAllFromDatabase = function(callback)
{
    console.log("(Re) Loading ontology configurations from database...");

    const getFullResearchDomain = function (researchDomainUri, callback) {
        ResearchDomain.findByUri(researchDomainUri, callback);
    };

    const addResearchDomainsDetails = function (ontology, callback) {
        if (ontology.domain instanceof Array) {
            async.map(ontology.domain, getFullResearchDomain, function (err, results) {
                if (!err) {
                    ontology.domain = results;
                }

                return callback(err, ontology);
            });
        }
        else if (typeof ontology.domain === "string") {
            async.map([ontology.domain], getFullResearchDomain, function (err, results) {
                if (!isNull(results)) {
                    ontology.domain = results;
                }

                return callback(err, ontology);
            });
        }
        else {
            return callback(null, ontology);
        }
    };

    const addValidationData = function (ontology, callback) {
        const getAlternativesForDescriptor = function (elementUri, callback) {
            db.connection.execute(
                "WITH [0] \n" +
                "SELECT ?alternative \n" +
                "WHERE \n" +
                "{ \n" +
                "   [1] ddr:hasAlternative ?alternative\n" +
                "} \n",
                [
                    {
                        type: DbConnection.resourceNoEscape,
                        value: ontology.uri
                    },
                    {
                        type: DbConnection.resourceNoEscape,
                        value: elementUri
                    }
                ],
                function (err, alternatives) {
                    if (!err) {
                        if (alternatives.length === 0) {
                            return callback(null, null);
                        }
                        else {
                            const results = [];

                            for (let i = 0; i < alternatives.length; i++) {
                                results.push(alternatives[i].alternative);
                            }

                            return callback(null, results);
                        }
                    }
                    else {
                        console.error("Error retrieving valid alternatives for descriptor " + elementUri + "! Error returned " + JSON.stringify(alternatives));
                        return callback(null, null);
                    }

                }
            );
        };

        const getRegexForDescriptor = function (elementUri, ontologyUri, callback) {
            db.connection.execute(
                "WITH [0] \n" +
                "SELECT ?regex \n" +
                "WHERE \n" +
                "{ \n" +
                "   [1] ddr:hasRegex ?regex\n" +
                "} \n",
                [
                    {
                        type: DbConnection.resourceNoEscape,
                        value: ontologyUri
                    },
                    {
                        type: DbConnection.resourceNoEscape,
                        value: elementUri
                    }
                ],
                function (err, regex) {
                    if (!err) {
                        if (regex.length > 1) {
                            console.error("There are two different Regular Expressions for validating element " + elementUri + "! Please review the ontology with URI " + ontologyUri + " and delete hasRegex annotation properties until there is only one.");
                            return callback(1, null);
                        }
                        else {
                            if (regex.length === 1) {
                                return callback(null, regex[0].regex);
                            }
                            else {
                                return callback(null, null);
                            }
                        }
                    }
                    else {
                        console.error("Error retrieving Regular Expression that validates " + elementUri + "! Error returned " + JSON.stringify(regex));
                        return callback(null, null);
                    }

                }
            );
        };

        if (!isNull(ontology.elements)) {
            async.map(
                Object.keys(ontology.elements),
                function (elementShortName, callback) {
                    const elementUri = Ontology.allOntologies[ontology.prefix].uri + elementShortName;
                    const element = ontology.elements[elementShortName];

                    async.waterfall([
                        function (callback) {
                            getRegexForDescriptor(elementUri, ontology.uri, function (err, result) {
                                if (!err) {
                                    if (!isNull(result)) {
                                        element.hasRegex = result;
                                        element.control = Config.controls.regex_checking_input_box;
                                    }
                                }

                                return callback(err, element);
                            });
                        }
                        ,
                        function (element, callback) {
                            getAlternativesForDescriptor(elementUri, function (err, result) {

                                if (!err) {
                                    if (!isNull(result)) {
                                        element.hasAlternative = result;
                                        element.control = Config.controls.combo_box;
                                    }
                                }

                                return callback(err, element);
                            });
                        }
                    ],
                    function (err, results) {
                        return callback(err, results);
                    });
                },
                function (err, results) {
                    return callback(err, results);
                });
        }
    };

    const checkForOntology = function (ontologyObject, callback) {
        Ontology.findByUri(ontologyObject.uri, function (err, ontology) {
            if (err) {
                console.log("Error occurred when searching for ontology with URI : " + ontologyObject.uri + ". Error description : " + JSON.stringify(ontology));
            }

            return callback(err, ontology);
        });
    };

    const createOntologyRecordInDatabase = function (ontologyObject, callback) {
        const newOntology = new Ontology(ontologyObject);

        newOntology.save(function (err, result) {
            return callback(err, result);
        });
    };

    const recreateOntologiesInDatabase = function (ontologiesArray, callback) {
        async.map(ontologiesArray, function (ontologyObject, callback) {
            checkForOntology(ontologyObject, function (err, ontology) {
                if (isNull(ontology)) {
                    createOntologyRecordInDatabase(ontologyObject, function (err, result) {
                        return callback(err, result);
                    });
                }
                else {
                    return callback(null, null);
                }
            });
        }, function (err, results) {
            return callback(err, results);
        });
    };

    const loadOntologyConfigurationsFromDatabase = function (callback) {
        Ontology.all(function (err, ontologies) {
            if (!err) {
                async.waterfall(
                    [
                        function (callback) {
                            async.map(ontologies, addResearchDomainsDetails, function (err, loadedOntologies) {
                                if (!err) {
                                    console.log("[INFO] Finished loading research domain configurations for descriptors from database");
                                }

                                return callback(err, loadedOntologies);
                            });
                        },
                        function (loadedOntologies, callback) {
                            async.map(loadedOntologies, addValidationData, function (err, loadedOntologies) {
                                if (!err) {
                                    console.log("[INFO] Finished loading validation information (Regex + alternatives) for the descriptors in the database");
                                }

                                return callback(err, loadedOntologies);
                            });
                        }
                    ],
                    function (err, loadedOntologies) {
                        if (!err) {
                            return callback(err, loadedOntologies);
                        }
                        else {
                            return callback(err, loadedOntologies);
                        }
                    }
                )
            }
            else {
                const msg = "[ERROR] Error loading ontology configurations from database: Unable to fetch all resources from the graph";
                console.log(msg);
                return callback(1, msg);
            }
        });
    };


    async.series([
        function(callback)
        {
            recreateOntologiesInDatabase(Ontology.getAllOntologiesArray(), function(err, result){
                return callback(err, result);
            });
        },
        function(callback)
        {
            loadOntologyConfigurationsFromDatabase(function(err, result){
                return callback(err, result);
            });
        }
    ],
    function(err, results)
    {
        return callback(err, results);
    });
};

Ontology.allOntologies = function()
{
    return global.allOntologies;
}();

Ontology.getAllOntologyPrefixes = function()
{
    if(isNull(Ontology.allOntologyPrefixes))
    {
        Ontology.allOntologyPrefixes = [];
        const ontologies = Ontology.getAllOntologiesArray();

        for(let i = 0; i < ontologies.length; i++)
        {
            const ontology = ontologies[i];
            Ontology.allOntologyPrefixes.push(ontology.prefix);
        }
    }

    return Ontology.allOntologyPrefixes;
};

Ontology.getAllOntologiesArray = function()
{
    Ontology.allOntologiesArray = [];

    for(let ontologyPrefix in Ontology.allOntologies)
    {
        if(Ontology.allOntologies.hasOwnProperty(ontologyPrefix))
        {
            const ontology = Ontology.allOntologies[ontologyPrefix];
            Ontology.allOntologiesArray.push(ontology);
        }
    }

    return Ontology.allOntologiesArray;
};

Ontology.getAllOntologiesUris = function()
{
    if(isNull(Ontology.ontologyUris))
    {
        const ontologies = Ontology.getAllOntologiesArray();

        Ontology.ontologyUris = [];

        for(let i = 0 ; i < ontologies.length; i++)
        {
            const ontology = ontologies[i];
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
    if(isNull(Ontology.publicOntologyPrefixes))
    {
        Ontology.publicOntologyPrefixes = [];

        const ontologies = Ontology.getAllOntologiesArray();

        for(let i = 0 ; i < ontologies.length; i++)
        {
            const ontology = ontologies[i];
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
    if(isNull(Ontology.publicOntologies))
    {
        Ontology.publicOntologies = [];

        if(!isNull(Config.public_ontologies) && Config.public_ontologies instanceof Array && Config.public_ontologies.length > 0)
        {
            var ontologies = _.filter(Ontology.getAllOntologiesArray(), function(ontology){
                return _.contains(Config.public_ontologies, ontology.prefix);
            });
        }
        else
        {
            var ontologies = Ontology.getAllOntologiesArray();
        }

        for(let i = 0 ; i < ontologies.length; i++)
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
    if(isNull(Ontology.publicOntologyUris))
    {
        Ontology.publicOntologyUris = [];

        const ontologies = Ontology.getAllOntologiesArray();
        for(let i = 0 ; i < ontologies.length; i++)
        {
            const ontology = ontologies[i];
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
    if(isNull(Ontology.ontologyPrefixesMatcher))
    {
        Ontology.ontologyPrefixesMatcher = {};

        const ontologies = Ontology.getAllOntologiesArray();

        for(let i = 0 ; i < ontologies.length; i++)
        {
            const ontology = ontologies[i];
            Ontology.ontologyPrefixesMatcher[ontology.uri] = ontology.prefix;
        }
    }

    return Ontology.ontologyPrefixesMatcher[ontologyUri];
};

Ontology.findByResearchDomainPrefixOrComment = function(query, maxNumberOfResults, callback)
{
    const results = [];

    const containsString = function (needle, haystack) {
        if (isNull(haystack)) {
            return false;
        }
        else {
            const downcasedNeedle = needle.toLowerCase();
            const downcasedHaystack = haystack.toLowerCase();

            if (downcasedHaystack.indexOf(downcasedNeedle) > -1) {
                return true;
            }
            else {
                return false;
            }
        }

    };

    const containsResearchDomain = function (ontology, query) {
        if (isNull(ontology.domain) || !(ontology.domain instanceof Array)) {
            return false;
        }
        else {
            for (let i = 0; i < ontology.domain.length; i++) {
                const aDomain = ontology.domain[i];

                //TODO should be aDomain.dcterms.description but not implemented yet
                return containsString(query, aDomain);
            }

        }
    };

    const ontologies = Ontology.getPublicOntologies();

    for(var i = 0; i < ontologies.length && results.length < maxNumberOfResults; i++)
    {
        var ontology = ontologies[i];

        if(!isNull(ontology.description) || !isNull(ontology.prefix) || (!isNull(ontology.domain)))
        {
            const typeOfDomain = typeof ontology.domain;
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

    return callback(null, results);
};

Ontology.prototype.save = function(callback)
{
    const self = this;
    const uri = self.uri;

    const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

    const description = new Descriptor(
        {
            prefixedForm: "dcterms:description",
            value: self.description
        });

    const domainsArray = [];

    if(!isNull(self.domain) && self.domain instanceof Array)
    {
        for(let i = 0; i < self.domain.length; i++)
        {
            domainsArray.push(self.domain[i].uri);
        }
    }

    const domain = new Descriptor(
        {
            prefixedForm: "ddr:hasResearchDomain",
            value: domainsArray
        });

    const type = new Descriptor({
        prefixedForm: "rdf:type",
        value: Ontology.prefixedRDFType
    });

    const prefix = new Descriptor({
        prefixedForm: "ddr:hasPrefix",
        value: self.prefix
    });

    const modified = new Descriptor({
        prefixedForm: "dcterms:modified",
        value: new Date().toISOString()
    });

    const newDescriptorsArray = [description, domain, type, prefix, modified];


    self.replaceDescriptorsInTripleStore(newDescriptorsArray, db.graphUri, function(err, result){
        if(!err)
        {
            return callback(err, result);
        }
        else
        {
            const msg = "Unable to SAVE ontology with uri : " + uri + " because of error: " + result;
            console.error(msg);
            return callback(err, msg);
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
                for(let i = 0; i < results.length; i++)
                {
                    domains.push(results['domain']);
                }
            }

            return callback(err, domains);
        });
};

Ontology.findByPrefix = function(prefix, callback)
{
    const prefixes = Object.keys(Ontology.allOntologies);

    //look first in memory, then go to the database if if fails.
    for (let i = 0; i < prefixes.length; i++)
    {
        const aPrefix = prefixes[i];
        if (aPrefix === prefix)
        {
            const result = {"uri": Ontology.allOntologies[aPrefix].uri};
            const ontology = new Ontology(result);
            return callback(null, ontology);
        }
    }

    const query =
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
            if (!err && !isNull(results))
            {
                if (results.length > 1)
                {
                    const msg = "[FATAL ERROR] More than one ontology registered for the same prefix in Dendro! There must be only one ontology with a given prefix! Prefix that has more than one ontology associated is : " + prefix;
                    console.error(msg);
                    return callback(1, msg);
                }
                else if (results.length === 1)
                {
                    const newOntology = new Ontology(results[0]);
                    return callback(null, newOntology);
                }
                else
                {
                    return callback(1, null);
                }
            }
        });
};

Ontology = Class.extend(Ontology, Resource, "ddr:Ontology");

module.exports.Ontology = Ontology;
