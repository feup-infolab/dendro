var Config = require("../meta/config.js").Config;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Elements = require(Config.absPathInSrcFolder("/models/meta/elements.js")).Elements;

var db = function() { return GLOBAL.db.default; }();
var async = require('async');
var _ = require('underscore');

function Descriptor(object)
{
    var self = this;

    if(object != null)
    {
        if(object.uri != null)
        {
            self.uri = object.uri;
            self.prefix = self.getNamespacePrefix();
            self.ontology = self.getOwnerOntologyUri();
            self.shortName = self.getShortName();
            self.prefixedForm = self.getPrefixedForm();
        }
        else if(object.ontology != null && object.shortName != null)
        {
            self.uri = object.ontology + object.shortName;
            self.prefix = self.getNamespacePrefix();
            self.ontology = self.getOwnerOntologyUri();
            self.shortName = self.getShortName();
            self.prefixedForm = self.getPrefixedForm();
        }
        else if(object.prefixedForm != null)
        {
            var indexOfColon = object.prefixedForm.indexOf(":");
            if(indexOfColon < 0)
            {
                var error = "Invalid prefixed form for descriptor " + object.prefixedForm;
                console.error(error);
                throw error;
            }
            else
            {
                self.prefix = object.prefixedForm.substr(0, indexOfColon);
                self.shortName = object.prefixedForm.substr(indexOfColon + 1); // + 1 = skip the ':' sign
                self.ontology = Ontology.allOntologies[self.prefix].uri;
                self.uri = Ontology.allOntologies[self.prefix].uri + self.shortName;
            }
        }
        else if(object.prefix != null && object.shortName != null)
        {
            self.prefix = object.prefix;
            self.shortName = object.shortName;
            self.ontology = Ontology.allOntologies[self.prefix].uri;
            self.uri = Ontology.allOntologies[self.prefix].uri + self.shortName;
            self.prefixedForm = self.getPrefixedForm();
        }
        else
        {
            var error = "Invalid Descriptor." + JSON.stringify(object) +". " +
                "Check that you have included one of the following: an uri; an ontology uri and shortName; a prefixed form; a prefix and a shortName. " +
                "Also, does that descriptor really belong to that ontology?";

            console.error(error);
            return {error : error};
        }

        if(Elements[self.prefix] == null)
        {
            var error = "Unknown ontology for -> " + object.uri +". The owning ontology of the descriptor is not parametrized in this Dendro instance.";

            if(Config.debug.log_missing_unknown_descriptors)
            {
                console.error(error);
            }

            return {error : error};
        }
        else if(Elements[self.prefix][self.shortName] == null && Config.debug.active && Config.debug.descriptors.log_missing_unknown_descriptors)
        {
            var error = "Unknown descriptor -> " + object.uri+". This descriptor is not parametrized in this Dendro instance; however, the ontology uri matches an ontology in this instance. Are you sure that descriptor belongs to that ontology? Check the final part of the URI, or parametrize the element in the elements.js file."
            console.error(error);
            return {error : error};
        }
        else
        {
            if(Elements[self.prefix] != null && Elements[self.prefix][self.shortName] != null)
            {
                self.type = Elements[self.prefix][self.shortName].type;
                self.control = Elements[self.prefix][self.shortName].control;

                if(Elements[self.prefix][self.shortName].hasAlternative != null)
                {
                    self.hasAlternative = Elements[self.prefix][self.shortName].hasAlternative;
                }

                if(Elements[self.prefix][self.shortName].hasRegex)
                {
                    self.hasRegex = Elements[self.prefix][self.shortName].hasRegex;
                }

                for(var descriptorType in Config.types)
                {
                    if(Elements[self.prefix][self.shortName] != null)
                    {
                        self[descriptorType] = Elements[self.prefix][self.shortName][descriptorType];
                    }
                }
            }
            else
            {
                self.type = DbConnection.string;
                if(Config.debug.active && Config.debug.descriptors.log_missing_unknown_descriptors)
                {
                    console.error("Unable to determine type of descriptor " + self.prefixedForm + ". Defaulting to string.");
                }
            }

            self.label = object.label;
            self.comment = object.comment;

            //override type if supplied in object argument

            if(object.type != null)
            {
                self.type = object.type;
            }

            self.setValue(object.value);

            //try to get parametrization from ontology level
            for(var descriptorType in Config.types)
            {
                if(self[descriptorType] == null &&
                    Ontology.allOntologies[self.prefix] != null &&
                    Ontology.allOntologies[self.prefix][descriptorType] != null)
                {
                    self[descriptorType] = Ontology.allOntologies[self.prefix][descriptorType];
                }
            }
            return self;
        }
    }
    else
    {
        var error = "No object supplied for descriptor creation";
        console.error(error);
        return {error : error};
    }
}

Descriptor.recommendation_types = {
    frequently_used_overall : {
        key : "frequently_used_overall",
        weight : 5
    },
    from_textually_similar: {
        key : "from_textually_similar",
        weight: 20.0
    },
    recently_used : {
        key : "recently_used",
        weight: 20.0
    },
    used_in_project : {
        key : "used_in_project",
        weight : 20.0
    },
    smart_accepted_in_metadata_editor : {
        key : "smart_accepted_in_metadata_editor",
        weight : 50.0
    },
    favorite_accepted_in_metadata_editor : {
        key : "favorite_accepted_in_metadata_editor",
        weight : 50.0
    },
    project_favorite : {
        key : "project_favorite",
        weight : 80.0
    },
    random : {
        key : "random",
        weight : 1.0
    },
    user_favorite : {
        key : "user_favorite",
        weight : 80.0
    },
    project_hidden : {
        key : "project_hidden",
        weight : 0.0
    },
    user_hidden : {
        key : "user_hidden",
        weight : 0.0
    },
    dc_element_forced : {
        key : "dc_element_forced",
        weight : 0.0
    }
};

Descriptor.DCElements = function(callback)
{
    var DCDescriptors= [
        new Descriptor({prefixedForm: "dcterms:contributor"}),
        new Descriptor({prefixedForm: "dcterms:coverage"}),
        new Descriptor({prefixedForm: "dcterms:creator"}),
        new Descriptor({prefixedForm: "dcterms:date"}),
        new Descriptor({prefixedForm: "dcterms:description"}),
        new Descriptor({prefixedForm: "dcterms:format"}),
        new Descriptor({prefixedForm: "dcterms:identifier"}),
        new Descriptor({prefixedForm: "dcterms:language"}),
        new Descriptor({prefixedForm: "dcterms:publisher"}),
        new Descriptor({prefixedForm: "dcterms:relation"}),
        new Descriptor({prefixedForm: "dcterms:rights"}),
        new Descriptor({prefixedForm: "dcterms:source"}),
        new Descriptor({prefixedForm: "dcterms:subject"}),
        new Descriptor({prefixedForm: "dcterms:title"}),
        new Descriptor({prefixedForm: "dcterms:type"})
    ];

    async.map(DCDescriptors, function(descriptor, callback){
        Descriptor.findByUri(descriptor.uri, callback);
    },
    function(err, fullDescriptors)
    {
        callback(err, fullDescriptors);
    });
};

Descriptor.findByUri = function(uri, callback)
{
    try{
        //create a new descriptor just to get the uri of the owning ontology
        var dummy = new Descriptor({
            uri : uri
        });

        var query =
                " SELECT ?label ?comment \n"+
                " FROM [0] \n"+
                " WHERE \n" +
                " { \n"+
                    " [1]   rdf:type    ?type. \n"+
                    " OPTIONAL \n" +
                    "{  \n" +
                    "   [1]    rdfs:label  ?label.  \n" +
                    "   FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
                    "} .\n"+
                    " OPTIONAL \n" +
                    "{  \n" +
                    "   [1]  rdfs:comment   ?comment.  \n" +
                    "   FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
                    "} .\n" +
                " } \n" +
                " LIMIT 1\n";

        db.connection.execute(query,
            [
                {
                    type : DbConnection.resourceNoEscape,
                    value : dummy.ontology
                },
                {
                    type : DbConnection.resourceNoEscape,
                    value : uri
                }
                //,
                /*{
                    type : DbConnection.string,
                    value : "en"
                }*/
            ],
            function(err, descriptors) {
                if(!err)
                {
                    if(descriptors.length == 0)
                    {
                        callback(0, null);
                    }
                    else
                    {
                        if(descriptors[0].uri == null)
                        {
                            descriptors[0].uri = uri;
                        }

                        var formattedDescriptor = new Descriptor(descriptors[0]);
                        callback(0, formattedDescriptor);
                    }
                }
                else
                {
                    console.error("Error fetching descriptor with uri : " + uri + " : " + descriptors);
                    callback(1, descriptors);
                }
            });
    }
    catch(e)
    {
        console.error("Exception finding descriptor by URI " + uri);
        callback(null, null);
    }
};

Descriptor.prototype.setValue = function(value)
{
    var self = this;
    if(typeof value == "string")
    {
        if(self.type == DbConnection.int)
        {
            self.value = parseInt(value);
        }
        else if(self.type == DbConnection.float)
        {
            self.value = parseFloat(value);
        }
        else if(self.type == DbConnection.boolean)
        {
            self.value = JSON.parse(value);
        }
        else
        {
            self.value = value;
        }
    }
    else
    {
        self.value = value;
    }
};

Descriptor.all_in_ontology = function(ontologyURI, callback) {

    var query =
        " SELECT ?uri ?type ?label ?comment \n"+
            " FROM [0] \n"+
            " WHERE \n" +
            " { \n"+
            "   {\n " +
            "      ?uri  rdf:type     rdf:Property    . \n"+
            "       OPTIONAL {  \n" +
            "           ?uri    rdfs:label  ?label .\n" +
            "           FILTER (lang(?label) = \"\" || lang(?label) = [1] )\n" +
            "       } .\n" +
            "       OPTIONAL {  \n" +
            "           ?uri  rdfs:comment   ?comment .\n" +
            "           FILTER (lang(?comment) = \"\" || lang(?comment) = [1] )\n" +
            "       } .\n" +
            "   } UNION {\n " +
            "      ?uri  rdf:type     owl:DatatypeProperty    . \n"+
            "       OPTIONAL {  \n" +
            "           ?uri    rdfs:label  ?label .\n" +
            "           FILTER (lang(?label) = \"\" || lang(?label) = [1] )\n" +
            "       } .\n" +
            "       OPTIONAL {  \n" +
            "           ?uri  rdfs:comment   ?comment .\n" +
            "           FILTER (lang(?comment) = \"\" || lang(?comment) = [1] )\n" +
            "       } .\n" +
            "   } \n" +
            " } \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : ontologyURI
            },
            {
                type : DbConnection.string,
                value : "en"
            }
        ],
        function(err, descriptors) {
            if(!err)
            {
                var formattedResults = [];

                for(var i = 0; i < descriptors.length; i++)
                {
                    var formattedDescriptor = new Descriptor(descriptors[i]);
                    formattedResults.push(formattedDescriptor);
                }

                callback(0, formattedResults);
            }
            else
            {
                console.error("Error fetching descriptors from ontology : "+ontologyURI + " " + descriptors);
                callback(1, descriptors);
            }
        });
};

Descriptor.removeUnauthorizedFromObject = function(object, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    if(object != null)
    {
        var authorizedDescriptors = Descriptor.getAuthorizedDescriptors(excludedDescriptorTypes, exceptionedDescriptorTypes);

        for (var prefix in Elements)
        {
            if(object[prefix] != null)
            {
                for(var shortName in Elements[prefix])
                {
                    if(object[prefix][shortName] != null && !authorizedDescriptors[prefix][shortName])
                    {
                        delete object[prefix][shortName];
                    }
                }
            }
        }
    }
    else
    {
        return(object);
    }
};

Descriptor.prototype.isAuthorized = function(excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    /**TODO make this more efficient**/
    var self = this;

    if(excludedDescriptorTypes == null)
    {
        return true;
    }
    else
    {
        var authorizedDescriptors = Descriptor.getAuthorizedDescriptors(excludedDescriptorTypes, exceptionedDescriptorTypes);

        if(authorizedDescriptors[self.prefix][self.shortName] == true)
        {
            return true;
        }
        else if(authorizedDescriptors[self.prefix][self.shortName] == false)
        {
            return false;
        }
        else if(authorizedDescriptors[self.prefix] == null)
        {
            return true;
        }
        else
        {
            return true;
        }
    }
}

Descriptor.getAuthorizedDescriptors = function(excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    var authorizedDescriptors = {};
    for (var prefix in Elements)
    {
        authorizedDescriptors[prefix] = {};

        for(var shortName in Elements[prefix])
        {
            authorizedDescriptors[prefix][shortName] = false;

            var excluded = false;
            var exceptioned = false;

            var descriptor = new Descriptor({
                prefix : prefix,
                shortName : shortName
            });

            if(exceptionedDescriptorTypes != null)
            {
                for(var i = 0; i < exceptionedDescriptorTypes.length; i++)
                {
                    var exceptionedType = exceptionedDescriptorTypes[i];

                    if(descriptor[exceptionedType])
                    {
                        exceptioned = true;
                    }
                }
            }

            if(excludedDescriptorTypes != null)
            {
                if(!exceptioned)
                {
                    for(var i = 0; i < excludedDescriptorTypes.length; i++)
                    {
                        var excludedType = excludedDescriptorTypes[i];

                        if(Ontology.allOntologies[prefix][excludedType] || descriptor[excludedType])
                        {
                            excluded = true;
                        }
                    }
                }
            }

            if(!excluded || exceptioned)
            {
                authorizedDescriptors[prefix][shortName] = true;
            }
        }
    }

    return authorizedDescriptors;
}

Descriptor.prototype.getNamespacePrefix = function()
{
    var self = this;
    var ontologyURI = self.getOwnerOntologyUri(self.uri);
    var prefix = Ontology.getOntologyPrefix(ontologyURI);
    return prefix;
}

Descriptor.prototype.getShortName = function()
{
    var self = this;

    var ontologyURI = self.getOwnerOntologyUri(self.uri);
    var shortName = self.uri.replace(ontologyURI, "");
    if(shortName[0] == ("/") || shortName[0] == "#")
    {
        shortName = shortName.substring();
    }
    return shortName;
}

Descriptor.prototype.getOwnerOntologyUri = function()
{
    var self = this;

    //ontology ends with a cardinal
    if(self.uri.match(/.*#[^#]+$/))
    {
        var ontologyURI = self.uri.replace(/#[^#]+$/, "#");
    }
    //ontology ends with a forward slash
    else if(self.uri.match(/.*\/[^\/]+$/))
    {
        var ontologyURI = self.uri.replace(/\/[^\/]+$/, "/");
    }

    //from http://stackoverflow.com/questions/8590052/regular-expression-remove-everything-after-last-forward-slash

    return ontologyURI;
};

Descriptor.prototype.getPrefixedForm = function()
{
    var self = this;

    var prefix = self.getNamespacePrefix();
    var shortName = self.getShortName();

    var shortDescriptor = prefix + ":" + shortName;

    return shortDescriptor;
};

Descriptor.mergeDescriptors = function(descriptorsArray, callback)
{
    var newDescriptors = {};

    //clear all descriptors
    var ontologyPrefixes = Ontology.getAllOntologyPrefixes();
    for(var i = 0; i < ontologyPrefixes.length; i++)
    {
        var aPrefix = ontologyPrefixes[i];
        newDescriptors[aPrefix] = {};
    }

    for(var i = 0; i < descriptorsArray.length; i++)
    {
        var descriptor = descriptorsArray[i];
        if(newDescriptors[descriptor.prefix][descriptor.shortName] instanceof Array)
        {
            if(descriptor.value instanceof Array)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = _.union(newDescriptors[descriptor.prefix][descriptor.shortName], descriptor.value);
            }
            else if(descriptor.value != null)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName].push(descriptor.value);
            }
        }
        else if(newDescriptors[descriptor.prefix][descriptor.shortName] != null)
        {
            if(descriptor.value instanceof Array)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = [descriptor.value].push(newDescriptors[descriptor.prefix][descriptor.shortName]);
            }
            else if(descriptor.value != null)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = [newDescriptors[descriptor.prefix][descriptor.shortName], descriptor.value];
            }
        }
        else
        {
            newDescriptors[descriptor.prefix][descriptor.shortName] = descriptor.value;
        }
    }

    var formattedDescriptors = [];
    for(var prefix in newDescriptors)
    {
        for(var shortName in newDescriptors[prefix])
        {
            formattedDescriptors.push(new Descriptor({
                prefix : prefix,
                shortName : shortName,
                value : newDescriptors[prefix][shortName]
            }));
        }
    }

    var getFullDescriptor = function(descriptor, cb)
    {
        Descriptor.findByUri(descriptor.uri, function(err, fullDescriptor)
        {
            if(!err && fullDescriptor != null && fullDescriptor instanceof Descriptor)
            {
                fullDescriptor.value = descriptor.value;
                cb(null, fullDescriptor);
            }
            else
            {
                cb(err, descriptor);
            }
        });
    };


    async.map(formattedDescriptors, getFullDescriptor, function(err, fullDescriptors)
    {
        callback(err, fullDescriptors);
    });
};

Descriptor.getRandomDescriptors = function(allowedOntologies, numberOfDescriptors, callback)
{
    var randomDescriptors = [];
    var descriptorCount = 0;

    var publicOntologies = Ontology.getPublicOntologiesUris();
    if(allowedOntologies != null && allowedOntologies instanceof Array && allowedOntologies.length > 0)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    /**
     * validate if ontologies are able to supply the requested amount of descriptors
     */

    for(var i = 0; i < allowedOntologies.length; i++)
    {
        var ontology = new Ontology(
            {
                uri: allowedOntologies[i]
            }
        );

        descriptorCount += Object.keys(ontology.elements).length;
    }

    if(descriptorCount < numberOfDescriptors)
    {
        numberOfDescriptors = descriptorCount;
    }

    /**lets get the descriptors**/

    async.whilst(
        function(){
            return randomDescriptors.length  < numberOfDescriptors;
        },
        function(cb)
        {
            var randomOntology = new Ontology({
                uri: _.sample(allowedOntologies)
            });

            if(randomOntology == null)
            {
                console.error("Error fetching random ontology from among " + JSON.stringify(allowedOntologies));
                callback(null);
            }
            else
            {
                var descriptorKeys = Object.keys(randomOntology.elements);
                var randomDescriptorKey = _.sample(descriptorKeys);

                var randomDescriptor = new Descriptor({
                    ontology: randomOntology.uri,
                    shortName: randomDescriptorKey
                });

                var alreadySelected = false;
                for(var i = 0; i < randomDescriptors.length; i++)
                {
                    if(randomDescriptors[i].uri == randomDescriptor.uri)
                    {
                        alreadySelected = true;
                        break;
                    }
                }

                if(randomDescriptor == null || randomDescriptor.error != null || alreadySelected)
                {
                    cb(null);
                }
                else
                {
                    Descriptor.findByUri(randomDescriptor.uri, function(err, descriptor)
                    {
                        if(!err)
                        {
                            if(descriptor != null && descriptor.error == null)
                            {
                                randomDescriptor.recommendation_types = {};
                                randomDescriptor.recommendation_types[Descriptor.recommendation_types.random.key] = true;
                                randomDescriptors.push(descriptor);
                            }
                            else
                            {
                                if(Config.debug.log_missing_unknown_descriptors)
                                {
                                    console.error("Unable to find descriptor with URI : "  + randomDescriptor.uri + ". Review the loaded ontologies and the elements.js configuration file.");
                                }

                                cb(null);
                            }

                            cb(null);
                        }
                        else
                        {
                            cb(1); //real ERROR, STOP HERE
                        }
                    });
                }
            }
        },
        function(err)
        {
            callback(err, randomDescriptors);
        }
    );
};

Descriptor.mostUsedPublicDescriptors = function(maxResults, callback, allowedOntologies)
{
    var argumentsArray = [
        {
            value : db.graphUri,
            type : DbConnection.resourceNoEscape
        }
    ];

    var publicOntologies = Ontology.getPublicOntologiesUris();
    if(allowedOntologies != null && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    var fromString = "";

    var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "uri");

    var query =
        "SELECT DISTINCT(?uri), ?label, ?comment, ?overall_use_count \n" +
        "WHERE { \n" +
        "{ \n" +
        "   SELECT DISTINCT(?uri), (count(?o) as ?overall_use_count) \n" +
        "   FROM [0] \n" +
        "   "+fromString + " \n"+
        "   WHERE \n" +
        "   { \n" +
        "       ?s ?uri ?o \n" +
        "   } \n" +
        "   GROUP BY ?uri \n" +
        "} . \n" +
        "OPTIONAL {  \n" +
        "   ?uri    rdfs:label  ?label . \n" +
        "   FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
        "}. \n" +
        "OPTIONAL {  \n" +
        "   ?uri  rdfs:comment   ?comment.  \n " +
        "   FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")"+
        "} . \n" +
        "   "+filterString + "\n" +
        "   FILTER( (str(?label) != \"\") && ( str(?comment) != \"\") ). \n"+
        "}" +
        "ORDER BY DESC(?overall_use_count) \n"+
        "LIMIT "+ maxResults;

    db.connection.execute(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(!err)
            {
                var createDescriptor = function(result, callback){

                    var suggestion = new Descriptor({
                        uri : result.uri,
                        label : result.label,
                        comment : result.comment
                    });

                    if(result.overall_use_count <= 0)
                    {
                        console.error("Descriptor "+ suggestion.uri + " recommended for overall use with invalid number of usages : " + result.recent_use_count);
                    }

                    //set recommendation type
                    suggestion.recommendation_types = {};
                    suggestion.recommendation_types[Descriptor.recommendation_types.frequently_used_overall.key] = true;
                    suggestion.overall_use_count = parseInt(result.overall_use_count);

                    if(suggestion instanceof Descriptor && suggestion.isAuthorized([Config.types.private,Config.types.locked]))
                    {
                        callback(0, suggestion);
                    }
                    else
                    {
                        callback(0, null);
                    }
                };

                async.map(descriptors, createDescriptor, function(err, fullDescriptors)
                {
                    if(!err)
                    {
                        /**remove nulls (that were unauthorized descriptors)**/
                        fullDescriptors = _.without(fullDescriptors, null);
                        callback(null, fullDescriptors);
                    }
                    else
                    {
                        callback(1, null);
                    }
                });
            }
            else
            {
                var util = require('util');
                console.error("Error fetching most used public descriptors: " + descriptors);
                callback(1, descriptors);
            }
        });
};

Descriptor.findByLabelOrComment = function(filterValue, maxResults, callback, allowedOntologies)
{
    var argumentsArray = [
        {
            value : db.graphUri,
            type : DbConnection.resourceNoEscape
        }
    ];

    var publicOntologies = Ontology.getPublicOntologiesUris();
    if(allowedOntologies != null && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    var fromString = "";

    var fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    var filterString = DbConnection.buildFilterStringForOntologies(Ontology.getPublicOntologiesUris(), "uri");

    var query =
        "SELECT DISTINCT(?uri)\n" +
        "FROM [0] \n" +
        fromString + " \n"+
        "WHERE { \n" +
        "   ?uri rdfs:comment ?comment . \n" +
        "   ?uri rdfs:label ?label . \n" +
        "   FILTER NOT EXISTS { ?uri rdf:type owl:Class } \n"+ //eliminate classes, as all descriptors are properties
        "   FILTER (regex(?label, \""+filterValue+"\", \"i\") || regex(?comment, \""+filterValue+"\", \"i\" )). \n" +
        "   FILTER (regex(?label, \""+filterValue+"\", \"i\") || regex(?comment, \""+filterValue+"\", \"i\" )). \n" +
        "   FILTER( (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "   "+filterString +
        " } \n"+
        " LIMIT  " + maxResults;

    db.connection.execute(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(!err)
            {
                var createDescriptor = function(result, callback){
                    Descriptor.findByUri(result.uri, function(err, descriptor){
                        callback(err, descriptor);
                    });
                };

                async.map(descriptors, createDescriptor, function(err, fullDescriptors)
                {
                    if(!err)
                    {
                        callback(null, fullDescriptors);
                    }
                    else
                    {
                        callback(1, null);
                    }
                });
            }
            else
            {
                var util = require('util');
                console.error("Error fetching descriptors by label or comment ontology. Filter value: " + filterValue + ". error reported: " + descriptors);
                callback(1, descriptors);
            }
        });
};

Descriptor.validateDescriptorParametrization = function(callback)
{
    var allOntologies = Ontology.getAllOntologiesUris();
    var error = null;

    async.mapLimit(allOntologies,
        1,
        function(ontology, callback)
        {
            Descriptor.all_in_ontology(ontology, function(err, descriptors)
            {
                if (!err)
                {
                    for(var i = 0; i < descriptors.length; i++)
                    {
                        var descriptor = descriptors[i];
                        try{
                            if(Elements[descriptor.prefix] == null)
                            {
                                console.error("Descriptor " + JSON.stringify(descriptor) + " has an unparametrized namespace " + descriptor.prefix + " . Check your elements.js file and ontology.js file");
                                error = 1;
                            }
                            else if(Elements[descriptor.prefix][descriptor.shortName] == null)
                            {
                                console.error("Descriptor " + descriptor.prefixedForm + " is not present in the elements.js file!");
                                error = 1;
                            }
                            else if(Elements[descriptor.prefix][descriptor.shortName].control == null)
                            {
                                console.error("Descriptor " + descriptor.prefixedForm + " is present in the elements.js file, but has no control type associated! Correct the error by setting the appropriate control type.");
                                error = 1;
                            }
                        }
                        catch(e)
                        {
                            callback(1, "Exception occurred when checking descriptor configuration " + JSON.stringify(e));
                        }
                    }

                    callback(null, null);
                }
                else
                {
                    callback(1, "Unable to fetch all descriptors from ontology " + ontology);
                }
            });
        },
        function(error, results)
        {
            if(error)
            {
                callback(1, "Some descriptors found to be not parametrized. Check your elements.js file and correct accordingly.")
            }
            else
            {
                callback(null);
            }
        }
    );
};

module.exports.Descriptor = Descriptor;
