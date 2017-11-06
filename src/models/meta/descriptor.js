const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("/models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const ObjectManipulator = require(Pathfinder.absPathInSrcFolder("/utils/object_manipulation.js"));

const db = Config.getDBByID();
const async = require("async");
const _ = require("underscore");

function Descriptor(object, typeConfigsToRetain)
{
    const self = this;

    if(!isNull(object))
    {
        if(!isNull(object.uri))
        {
            self.uri = object.uri;
            self.prefix = self.getNamespacePrefix();
            self.ontology = self.getOwnerOntologyUri();
            self.shortName = self.getShortName();
            self.prefixedForm = self.getPrefixedForm();
        }
        else if(!isNull(object.ontology) && !isNull(object.shortName))
        {
            self.uri = object.ontology + object.shortName;
            self.prefix = self.getNamespacePrefix();
            self.ontology = self.getOwnerOntologyUri();
            self.shortName = self.getShortName();
            self.prefixedForm = self.getPrefixedForm();
        }
        else if(!isNull(object.prefixedForm))
        {
            const indexOfColon = object.prefixedForm.indexOf(":");
            if(indexOfColon < 0)
            {
                const error = "Invalid prefixed form for descriptor " + object.prefixedForm;
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
        else if(!isNull(object.prefix) && !isNull(object.shortName))
        {
            self.prefix = object.prefix;
            self.shortName = object.shortName;
            self.ontology = Ontology.allOntologies[self.prefix].uri;
            self.uri = Ontology.allOntologies[self.prefix].uri + self.shortName;
            self.prefixedForm = self.getPrefixedForm();
        }
        else
        {
            const error = "Invalid Descriptor." + JSON.stringify(object) +". " +
                "Check that you have included one of the following: an uri; an ontology uri and shortName; a prefixed form; a prefix and a shortName. " +
                "Also, does that descriptor really belong to that ontology?";

            console.error(error);
            return {error : error};
        }

        if(isNull(Elements.ontologies[self.prefix]))
        {
            const error = "Unknown ontology for -> " + object.uri +". The owning ontology of the descriptor is not parametrized in this Dendro instance.";

            if(Config.debug.log_missing_unknown_descriptors)
            {
                console.error(error);
            }

            return {error : error};
        }
        else if(isNull(Elements.ontologies[self.prefix][self.shortName]) && Config.debug.active && Config.debug.descriptors.log_missing_unknown_descriptors)
        {
            const error = "Unknown descriptor -> " + object.uri+". This descriptor is not parametrized in this Dendro instance; however, the ontology uri matches an ontology in this instance. Are you sure that descriptor belongs to that ontology? Check the final part of the URI, or parametrize the element in the elements.js file.";
            console.error(error);
            return {error : error};
        }
        else
        {
            if(!isNull(Elements.ontologies[self.prefix]) && !isNull(Elements.ontologies[self.prefix][self.shortName]))
            {
                const element = Elements.ontologies[self.prefix][self.shortName];
                self.type = element.type;
                self.control = element.control;

                if(!isNull(object.label))
                {
                    self.label = object.label;
                }
                else
                {
                    self.label = element.label;
                }

                if(!isNull(object.comment))
                {
                    self.comment = object.comment;
                }
                else
                {
                    self.comment = element.comment;
                }

                //override type if supplied in object argument

                if(!isNull(object.type))
                {
                    self.type = object.type;
                }
                else
                {
                    self.type = element.type;
                }

                if(!isNull(element.hasAlternative))
                {
                    self.hasAlternative = element.hasAlternative;
                }

                if(element.hasRegex)
                {
                    self.hasRegex = element.hasRegex;
                }

                for(let descriptorType in Elements.access_types)
                {
                    if(Elements.access_types.hasOwnProperty(descriptorType))
                    {
                        if (element[descriptorType])
                        {
                            self[descriptorType] = element[descriptorType];
                        }
                    }
                }

                if(!isNull(typeConfigsToRetain) && typeConfigsToRetain instanceof Array)
                {
                    for(let i = 0; i < typeConfigsToRetain.length; i++)
                    {
                        let type = typeConfigsToRetain[i];
                        if (Elements.access_types.hasOwnProperty(type))
                        {
                            if(!isNull(object[type]))
                            {
                                self[type] = object[type];
                            }
                            else if(!isNull(element) && isNull(element[type]))
                            {
                                self[type] = element[type];
                            }
                        }
                    }
                }

                self.setValue(object.value);

                //try to get parametrization from ontology level
                for(let descriptorType in Elements.access_types)
                {
                    if(Elements.access_types.hasOwnProperty(descriptorType))
                    {
                        if(isNull(self[descriptorType]) &&
                            !isNull(Ontology.allOntologies[self.prefix]) &&
                            !isNull(Ontology.allOntologies[self.prefix][descriptorType]))
                        {
                            self[descriptorType] = Ontology.allOntologies[self.prefix][descriptorType];
                        }
                    }
                }
            }
            else
            {
                self.type = Elements.types.string;
                if(Config.debug.active && Config.debug.descriptors.log_missing_unknown_descriptors)
                {
                    console.error("Unable to determine type of descriptor " + self.prefixedForm + ". Defaulting to string.");
                }
            }

            return self;
        }
    }
    else
    {
        const error = "No object supplied for descriptor creation";
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
    },
    project_descriptors : {
        key : "dc_element_forced",
        weight : 0.0
    }
};

Descriptor.dublinCoreElements = function(callback)
{
    const DCDescriptors = [
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

    async.mapSeries(DCDescriptors, function(descriptor, callback){
        Descriptor.findByUri(descriptor.uri, callback);
    },
    function(err, fullDescriptors)
    {
        return callback(err, fullDescriptors);
    });
};

Descriptor.findByUri = function(uri, callback)
{
    try{
        //create a new descriptor just to get the uri of the owning ontology
        const dummy = new Descriptor({
            uri: uri
        });

        const query =
            " SELECT ?label ?comment \n" +
            " FROM [0] \n" +
            " WHERE \n" +
            " { \n" +
            " [1]   rdf:type    ?type. \n" +
            " OPTIONAL \n" +
            "{  \n" +
            "   [1]    rdfs:label  ?label.  \n" +
            "   FILTER (lang(?label) = \"\" || lang(?label) = \"en\")" +
            "} .\n" +
            " OPTIONAL \n" +
            "{  \n" +
            "   [1]  rdfs:comment   ?comment.  \n" +
            "   FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
            "} .\n" +
            " } \n" +
            " LIMIT 1\n";

        db.connection.executeViaJDBC(query,
            [
                {
                    type : Elements.types.resourceNoEscape,
                    value : dummy.ontology
                },
                {
                    type : Elements.types.resourceNoEscape,
                    value : uri
                }
                //,
                /*{
                    type : Elements.types.string,
                    value : "en"
                }*/
            ],
            function(err, descriptors) {
                if(isNull(err))
                {
                    if(descriptors.length === 0)
                    {
                        return callback(null, null);
                    }
                    else
                    {
                        if(isNull(descriptors[0].uri))
                        {
                            descriptors[0].uri = uri;
                        }

                        const formattedDescriptor = new Descriptor(descriptors[0]);
                        return callback(null, formattedDescriptor);
                    }
                }
                else
                {
                    console.error("Error fetching descriptor with uri : " + uri + " : " + descriptors);
                    return callback(1, descriptors);
                }
            });
    }
    catch(e)
    {
        console.error("Exception finding descriptor by URI " + uri);
        return callback(null, null);
    }
};

Descriptor.prototype.setValue = function(value)
{
    const self = this;
    if(typeof value === "string")
    {
        if(self.type === Elements.types.int)
        {
            self.value = parseInt(value);
        }
        else if(self.type === Elements.types.float)
        {
            self.value = parseFloat(value);
        }
        else if(self.type === Elements.types.boolean)
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

Descriptor.all_in_ontology = function(ontologyURI, callback, page_number, pagesize, forceLoadFromTripleStore) {

    const getFromTripleStore = function(callback)
    {
        let query =
            " SELECT DISTINCT ?uri ?label ?comment \n"+
            " FROM [0] \n"+
            " WHERE \n" +
            " { \n"+
            "    FILTER( STRSTARTS(str(?uri), str([0]) ) )    . \n" +
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
            "   } UNION {\n " +
            "      ?uri  rdf:type     owl:ObjectProperty    . \n"+
            "       OPTIONAL {  \n" +
            "           ?uri    rdfs:label  ?label .\n" +
            "           FILTER (lang(?label) = \"\" || lang(?label) = [1] )\n" +
            "       } .\n" +
            "       OPTIONAL {  \n" +
            "           ?uri  rdfs:comment   ?comment .\n" +
            "           FILTER (lang(?comment) = \"\" || lang(?comment) = [1] )\n" +
            "       } .\n" +
            "   } \n" +
            " } \n" +
            " ORDER BY ASC(?label) \n";

        let args = [
            {
                type: Elements.types.resourceNoEscape,
                value: ontologyURI
            },
            {
                type: Elements.types.string,
                value: "en"
            }
        ];


        if(typeof page_number === "number")
        {
            query = query  +
                " OFFSET [2] \n" +
                " LIMIT [3] \n";


            args = args.concat([
                {
                    type : Elements.types.int,
                    value :  page_number * pagesize
                },
                {
                    type : Elements.types.int,
                    value : page_number * (pagesize + 1)
                }
            ]);
        }


        db.connection.executeViaJDBC(query, args,
            function(err, descriptors) {
                if(isNull(err))
                {
                    const formattedResults = [];

                    for(let i = 0; i < descriptors.length; i++)
                    {
                        const formattedDescriptor = new Descriptor(descriptors[i]);
                        formattedResults.push(formattedDescriptor);
                    }

                    return callback(null, formattedResults);
                }
                else
                {
                    console.error("Error fetching descriptors from ontology : "+ontologyURI + " " + descriptors);
                    return callback(1, descriptors);
                }
            });
    };

    const getFromCache = function()
    {
        const prefix = Ontology.getOntologyPrefix(ontologyURI);
        let results;

        if(!isNull(prefix))
        {
            if(!isNull(Elements.ontologies[prefix]))
            {
                let elements = Elements.ontologies[prefix];

                if(!isNull(elements))
                {
                    if(!isNull(page_number) && !isNull(pagesize))
                    {
                        elements = elements.slice(pagesize * page_number, pagesize * page_number + pagesize);
                    }

                    elements = _.mapObject(elements, function(element, shortName){
                        return new Descriptor(
                            {
                                prefix : prefix,
                                shortName : shortName
                            });
                    });

                    return elements;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }
        else
        {
            return null;
        }
    };

    if(forceLoadFromTripleStore)
    {
        getFromTripleStore(function(err, results){
            callback(err, results);
        })
    }
    else
    {
        let results = getFromCache();

        if(isNull(results))
        {
            getFromTripleStore(function(err, results){
                callback(err, results);
            })
        }
        else
        {
            callback(null, results);
        }
    }
};


Descriptor.all_in_ontologies = function(ontologyURIsArray, callback, page_number, page_size) {
    const async = require("async");
    async.mapSeries(ontologyURIsArray, function(uri, cb){
        Descriptor.all_in_ontology(uri, function(err, descriptors){
            cb(err, descriptors);
        });
    },function(err, results){
        if(isNull(err))
        {
            let flat = _.flatten(_.map(results, _.values))

            flat = _.sortBy(flat, function(descriptor){
                return descriptor.shortName;
            });

            if(typeof page_number !== "undefined" && typeof page_size !== "undefined")
            {
                try{
                    page_number = parseInt(page_number);
                    page_size = parseInt(page_size);
                }
                catch(e)
                {
                    return callback(1, "Unable to parse page size of page number");
                }
            }

            if(typeof page_number === "number" && typeof page_size === "number")
            {
                const offset = page_number * page_size;
                flat = flat.slice(offset, offset + page_size);
            }

            return callback(err, flat);
        }
        else
        {
            return callback(err, results);
        }

    });
};

Descriptor.removeUnauthorizedFromObject = function(object, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    if(!isNull(object))
    {
        for (let prefix in Elements.ontologies)
        {
            if(!isNull(object[prefix]))
            {
                for(let shortName in Elements.ontologies[prefix])
                {
                    if(Elements.ontologies.hasOwnProperty(prefix) && Elements.ontologies[prefix].hasOwnProperty(shortName))
                    {
                        if(!isNull(object[prefix][shortName]) && !Descriptor.isAuthorized(prefix, shortName, excludedDescriptorTypes, exceptionedDescriptorTypes))
                        {
                            if(Config.debug.descriptors.log_descriptor_filtering_operations)
                            {
                                console.log("Removing descriptor " + prefix +":" + shortName + " because excluded descriptor types are " + JSON.stringify(excludedDescriptorTypes) + " and exceptioned descriptor types are " + JSON.stringify(exceptionedDescriptorTypes));
                            }
                            delete object[prefix][shortName];
                        }
                    }
                }
            }
        }

        return object;
    }
    else
    {
        return object;
    }
};

Descriptor.isAuthorized = function(prefix, shortName, excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    if(isNull(excludedDescriptorTypes))
        return true;
    else
    {
        if(isNull(exceptionedDescriptorTypes))
        {
            exceptionedDescriptorTypes = [];
        }
        
        const _ = require("underscore");
        const sortedExcluded = excludedDescriptorTypes.sort();
        const sortedExceptioned = exceptionedDescriptorTypes.sort();

        const sum = require('hash-sum');
        const excludedHash = sum(sortedExcluded);
        const exceptionedHash = sum(sortedExceptioned);

        if(isNull(Descriptor.excludedDescriptors))
        {
            Descriptor.excludedDescriptors = {};
        }

        if(isNull(Descriptor.exceptionedDescriptors))
        {
            Descriptor.exceptionedDescriptors = {};
        }

        const getDescriptorsOfType = function (type) {
            const descriptorsOfType = {};

            for (let prefix in Elements.ontologies) {
                if(isNull(descriptorsOfType[prefix]))
                {
                    descriptorsOfType[prefix] = {};
                }

                for (let shortName in Elements.ontologies[prefix]) {
                    if (!isNull(Elements.ontologies[prefix]) && !isNull(Elements.ontologies[prefix][shortName]))
                    {
                        let descriptor = Elements.ontologies[prefix][shortName];

                        if (!isNull(descriptor[type]) && descriptor[type])
                        {
                            descriptorsOfType[prefix][shortName] = true;
                        }
                    }
                }
            }

            return descriptorsOfType;
        }

        if(isNull(Descriptor.exceptionedDescriptors[exceptionedHash]))
        {
            let allExceptioned = {};
            for(let i = 0; i < exceptionedDescriptorTypes.length; i++)
            {
                let descriptorsOfExceptionedType = getDescriptorsOfType(exceptionedDescriptorTypes[i]);
                ObjectManipulator.mergeDeep(allExceptioned, descriptorsOfExceptionedType);
            }

            Descriptor.exceptionedDescriptors[exceptionedHash] = allExceptioned;
        }

        if(isNull(Descriptor.excludedDescriptors[excludedHash]))
        {
            let allExcluded = {};
            for(let i = 0; i < excludedDescriptorTypes.length; i++)
            {
                let descriptorsOfExcludedType = getDescriptorsOfType(excludedDescriptorTypes[i]);
                ObjectManipulator.mergeDeep(allExcluded, descriptorsOfExcludedType);
            }

            Descriptor.excludedDescriptors[excludedHash] = allExcluded;
        }

        const existsInMap = function (map, prefix, shortName)
        {
            if(!isNull(map) &&  !isNull(map[prefix]))
            {
                if(map[prefix] && map[prefix][shortName])
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        };

        if(existsInMap(Descriptor.exceptionedDescriptors[exceptionedHash], prefix, shortName))
            return true;
        else if(existsInMap(Descriptor.excludedDescriptors[excludedHash], prefix, shortName))
        {
            if(Config.debug.descriptors.log_descriptor_filtering_operations)
            {
                console.log("Removing descriptor " + prefix +":" + shortName + " because excluded descriptor types are " + JSON.stringify(excludedDescriptorTypes) + " and exceptioned descriptor types are " + JSON.stringify(exceptionedDescriptorTypes));
            }
            return false;
        }
        else
            return true;
    }
};

Descriptor.prototype.isAuthorized = function(excludedDescriptorTypes, exceptionedDescriptorTypes)
{
    const self = this;
    const prefix = self.getNamespacePrefix();
    const shortName = self.getShortName();

    if(isNull(excludedDescriptorTypes) && isNull(exceptionedDescriptorTypes))
    {
        return true;
    }

    //TODO shortname is coming undefined here on some conditions! check

    if(!isNull(prefix) && !isNull(shortName))
    {
        const isAuthorized = Descriptor.isAuthorized(prefix, shortName, excludedDescriptorTypes, exceptionedDescriptorTypes);
        return isAuthorized;
    }
    else
    {
        throw new Error("Invalid descriptor " + prefix + ":" + shortName);
    }
};

Descriptor.prototype.getNamespacePrefix = function()
{
    const self = this;
    const ontologyURI = self.getOwnerOntologyUri(self.uri);
    const prefix = Ontology.getOntologyPrefix(ontologyURI);
    return prefix;
};

Descriptor.prototype.getShortName = function()
{
    const self = this;

    const ontologyURI = self.getOwnerOntologyUri(self.uri);
    let shortName = self.uri.replace(ontologyURI, "");
    if(shortName[0] === ("/") || shortName[0] === "#")
    {
        shortName = shortName.substring();
    }
    return shortName;
};

Descriptor.prototype.getOwnerOntologyUri = function()
{
    const self = this;
    let ontologyURI;

    //ontology ends with a cardinal
    if(self.uri.match(/.*#[^#]+$/))
    {
        ontologyURI = self.uri.replace(/#[^#]+$/, "#");
    }
    //ontology ends with a forward slash
    else if(self.uri.match(/.*\/[^\/]+$/))
    {
        ontologyURI = self.uri.replace(/\/[^\/]+$/, "/");
    }

    //from http://stackoverflow.com/questions/8590052/regular-expression-remove-everything-after-last-forward-slash

    return ontologyURI;
};

Descriptor.prototype.getPrefixedForm = function()
{
    const self = this;

    const prefix = self.getNamespacePrefix();
    const shortName = self.getShortName();

    const shortDescriptor = prefix + ":" + shortName;

    return shortDescriptor;
};

Descriptor.prefixedFormsToFullUris = function(arrayOfPrefixedForms)
{
    let arrayOfFullDescriptorUris = [arrayOfPrefixedForms.length];

    for(let i = 0; i < arrayOfPrefixedForms.length; i++)
    {
        let prefixedForm = arrayOfPrefixedForms[i];
        let descriptor = new Descriptor({
            prefixedForm : prefixedForm
        });

        arrayOfFullDescriptorUris[i] = descriptor.uri;
    }

    return arrayOfFullDescriptorUris;
}

Descriptor.mergeDescriptors = function(descriptorsArray, callback)
{
    const newDescriptors = {};

    //clear all descriptors
    const ontologyPrefixes = Ontology.getAllOntologyPrefixes();
    for(var i = 0; i < ontologyPrefixes.length; i++)
    {
        const aPrefix = ontologyPrefixes[i];
        newDescriptors[aPrefix] = {};
    }

    for(var i = 0; i < descriptorsArray.length; i++)
    {
        const descriptor = descriptorsArray[i];
        if(newDescriptors[descriptor.prefix][descriptor.shortName] instanceof Array)
        {
            if(descriptor.value instanceof Array)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = _.union(newDescriptors[descriptor.prefix][descriptor.shortName], descriptor.value);
            }
            else if(!isNull(descriptor.value))
            {
                newDescriptors[descriptor.prefix][descriptor.shortName].push(descriptor.value);
            }
        }
        else if(!isNull(newDescriptors[descriptor.prefix][descriptor.shortName]))
        {
            if(descriptor.value instanceof Array)
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = [descriptor.value].push(newDescriptors[descriptor.prefix][descriptor.shortName]);
            }
            else if(!isNull(descriptor.value))
            {
                newDescriptors[descriptor.prefix][descriptor.shortName] = [newDescriptors[descriptor.prefix][descriptor.shortName], descriptor.value];
            }
        }
        else
        {
            newDescriptors[descriptor.prefix][descriptor.shortName] = descriptor.value;
        }
    }

    const formattedDescriptors = [];
    for(let prefix in newDescriptors)
    {
        for(let shortName in newDescriptors[prefix])
        {
            formattedDescriptors.push(new Descriptor({
                prefix : prefix,
                shortName : shortName,
                value : newDescriptors[prefix][shortName]
            }));
        }
    }

    const getFullDescriptor = function (descriptor, cb) {
        Descriptor.findByUri(descriptor.uri, function (err, fullDescriptor) {
            if (isNull(err) && !isNull(fullDescriptor) && fullDescriptor instanceof Descriptor) {
                fullDescriptor.value = descriptor.value;
                cb(null, fullDescriptor);
            }
            else {
                cb(err, descriptor);
            }
        });
    };


    async.mapSeries(formattedDescriptors, getFullDescriptor, function(err, fullDescriptors)
    {
        return callback(err, fullDescriptors);
    });
};

Descriptor.getRandomDescriptors = function(allowedOntologies, numberOfDescriptors, callback)
{
    const randomDescriptors = [];
    let descriptorCount = 0;

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if(!isNull(allowedOntologies) && allowedOntologies instanceof Array && allowedOntologies.length > 0)
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
        const ontology = new Ontology(
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
            const randomOntology = new Ontology({
                uri: _.sample(allowedOntologies)
            });

            if(isNull(randomOntology))
            {
                console.error("Error fetching random ontology from among " + JSON.stringify(allowedOntologies));
                return callback(null);
            }
            else
            {
                const descriptorKeys = Object.keys(randomOntology.elements);
                const randomDescriptorKey = _.sample(descriptorKeys);

                const randomDescriptor = new Descriptor({
                    ontology: randomOntology.uri,
                    shortName: randomDescriptorKey
                });

                let alreadySelected = false;
                for(let i = 0; i < randomDescriptors.length; i++)
                {
                    if(randomDescriptors[i].uri === randomDescriptor.uri)
                    {
                        alreadySelected = true;
                        break;
                    }
                }

                if(isNull(randomDescriptor) || !isNull(randomDescriptor.error) || alreadySelected)
                {
                    cb(null);
                }
                else
                {
                    Descriptor.findByUri(randomDescriptor.uri, function(err, descriptor)
                    {
                        if(isNull(err))
                        {
                            if(!isNull(descriptor) && isNull(descriptor.error))
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
            return callback(err, randomDescriptors);
        }
    );
};

Descriptor.mostUsedPublicDescriptors = function(maxResults, callback, allowedOntologies)
{
    let argumentsArray = [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if(!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = "";

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "uri");

    const query =
        "SELECT DISTINCT(?uri), ?label, ?comment, ?overall_use_count \n" +
        "WHERE { \n" +
        "{ \n" +
        "   SELECT DISTINCT(?uri), (count(?o) as ?overall_use_count) \n" +
        "   FROM [0] \n" +
        "   " + fromString + " \n" +
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
        "   FILTER (lang(?comment) = \"\" || lang(?comment) = \"en\")" +
        "} . \n" +
        "   " + filterString + "\n" +
        "   FILTER( (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "}" +
        "ORDER BY DESC(?overall_use_count) \n" +
        "LIMIT " + maxResults;

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(isNull(err))
            {
                const createDescriptor = function (result, callback) {

                    const suggestion = new Descriptor({
                        uri: result.uri,
                        label: result.label,
                        comment: result.comment
                    });

                    if (result.overall_use_count <= 0) {
                        console.error("Descriptor " + suggestion.uri + " recommended for overall use with invalid number of usages : " + result.recent_use_count);
                    }

                    //set recommendation type
                    suggestion.recommendation_types = {};
                    suggestion.recommendation_types[Descriptor.recommendation_types.frequently_used_overall.key] = true;
                    suggestion.overall_use_count = parseInt(result.overall_use_count);

                    if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked])) {
                        return callback(null, suggestion);
                    }
                    else {
                        return callback(null, null);
                    }
                };

                async.mapSeries(descriptors, createDescriptor, function(err, fullDescriptors)
                {
                    if(isNull(err))
                    {
                        /**remove nulls (that were unauthorized descriptors)**/
                        fullDescriptors = _.without(fullDescriptors, null);
                        return callback(null, fullDescriptors);
                    }
                    else
                    {
                        return callback(1, null);
                    }
                });
            }
            else
            {
                const util = require('util');
                console.error("Error fetching most used public descriptors: " + descriptors);
                return callback(1, descriptors);
            }
        });
};

Descriptor.findByLabelOrComment = function(filterValue, maxResults, callback, allowedOntologies)
{
    let argumentsArray = [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if(!isNull(allowedOntologies) && allowedOntologies instanceof Array)
    {
        allowedOntologies = _.intersection(publicOntologies, allowedOntologies);
    }
    else
    {
        allowedOntologies = publicOntologies;
    }

    let fromString = "";

    const fromElements = DbConnection.buildFromStringAndArgumentsArrayForOntologies(allowedOntologies, argumentsArray.length);
    argumentsArray = argumentsArray.concat(fromElements.argumentsArray);
    fromString = fromString + fromElements.fromString;

    const filterString = DbConnection.buildFilterStringForOntologies(Ontology.getPublicOntologiesUris(), "uri");

    const query =
        "SELECT DISTINCT(?uri)\n" +
        "FROM [0] \n" +
        fromString + " \n" +
        "WHERE { \n" +
        "   ?uri rdfs:comment ?comment . \n" +
        "   ?uri rdfs:label ?label . \n" +
        "   FILTER NOT EXISTS { ?uri rdf:type owl:Class } \n" + //eliminate classes, as all descriptors are properties
        "   FILTER (regex(?label, \"" + filterValue + "\", \"i\") || regex(?comment, \"" + filterValue + "\", \"i\" )). \n" +
        "   FILTER( (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "   " + filterString +
        " } \n" +
        " LIMIT  " + maxResults;

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(isNull(err))
            {
                const createDescriptor = function (result, callback) {
                    Descriptor.findByUri(result.uri, function (err, descriptor) {
                        return callback(err, descriptor);
                    });
                };

                async.mapSeries(descriptors, createDescriptor, function(err, fullDescriptors)
                {
                    if(isNull(err))
                    {
                        return callback(null, fullDescriptors);
                    }
                    else
                    {
                        return callback(1, null);
                    }
                });
            }
            else
            {
                const util = require('util');
                console.error("Error fetching descriptors by label or comment ontology. Filter value: " + filterValue + ". error reported: " + descriptors);
                return callback(1, descriptors);
            }
        });
};

Descriptor.validateDescriptorParametrization = function(callback)
{
    const allOntologies = Ontology.getAllOntologiesUris();
    let error = null;

    async.mapLimit(allOntologies,
        1,
        function(ontology, callback)
        {
            Descriptor.all_in_ontology(ontology, function(err, descriptors)
            {
                if (isNull(err))
                {
                    for(let i = 0; i < descriptors.length; i++)
                    {
                        const descriptor = descriptors[i];
                        try{
                            if(isNull(Elements.ontologies[descriptor.prefix]))
                            {
                                if(Config.debug.descriptors.log_missing_unknown_descriptors)
                                    console.error("Descriptor " + JSON.stringify(descriptor) + " has an unparametrized namespace " + descriptor.prefix + " . Check your elements.js file and ontology.js file");

                                error = 1;
                            }
                            else if(isNull(Elements.ontologies[descriptor.prefix][descriptor.shortName]))
                            {
                                if(Config.debug.descriptors.log_missing_unknown_descriptors)
                                    console.error("Descriptor " + descriptor.prefixedForm + " is not present in the elements.js file!");

                                error = 1;
                            }
                            else if(isNull(Elements.ontologies[descriptor.prefix][descriptor.shortName].control))
                            {
                                if(Config.debug.descriptors.log_missing_unknown_descriptors)
                                    console.error("Descriptor " + descriptor.prefixedForm + " is present in the elements.js file, but has no control type associated! Correct the error by setting the appropriate control type.");

                                error = 1;
                            }
                        }
                        catch(e)
                        {
                            console.error(e.stack);
                            return callback(1, "Exception occurred when checking descriptor configuration " + JSON.stringify(e));
                        }
                    }

                    if(error && Config.debug.descriptors.log_missing_unknown_descriptors)
                        console.error("[WARNING] There are unparametrized descriptors in ontology " + ontology);

                    return callback(null);
                }
                else
                {
                    return callback(1, "Unable to fetch all descriptors from ontology " + ontology);
                }
            });
        },
        function(error, results)
        {
            if(error)
            {
                return callback(1, "Some descriptors found to be not parametrized. Check your elements.js file and correct accordingly.")
            }
            else
            {
                return callback(null);
            }
        }
    );
};

Descriptor.getUriFromPrefixedForm = function(prefixedForm)
{
    if (!isNull(prefixedForm)) {
        const indexOfColon = prefixedForm.indexOf(":");
        const indexOfHash = prefixedForm.indexOf("#");
        let indexOfSeparator = -1;

        if(indexOfColon < 0 && indexOfHash > -1)
        {
            indexOfSeparator = indexOfHash;
        }
        else if(indexOfColon > -1 && indexOfHash < 0)
        {
            indexOfSeparator = indexOfColon;
        }

        if (indexOfSeparator > 0) {
            const prefix = prefixedForm.substr(0, indexOfSeparator);
            const element = prefixedForm.substr(indexOfSeparator + 1);
            const ontology = Ontology.allOntologies[prefix].uri;
            const valueAsFullUri = ontology + element;
            return valueAsFullUri;
        }
        else {
            throw new Error("Value " + prefixedForm + " is not valid. It does not have either a : or a # in the prefixed form.");
        }
    }
    else
    {
        throw new Error("Value " + prefixedForm.value + " is null!");
    }
}

Descriptor.convertToFullUris = function(prefixedFormsArray)
{
    const results = _.map(prefixedFormsArray, Descriptor.getUriFromPrefixedForm);
    return results;
}

module.exports.Descriptor = Descriptor;
