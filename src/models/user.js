const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const DendroMongoClient = require(Pathfinder.absPathInSrcFolder("/kb/mongo.js")).DendroMongoClient;

const async = require("async");
const _ = require("underscore");

const db = Config.getDBByID();
const gfs = Config.getGFSByID();

function User (object)
{
    const self = this;
    self.addURIAndRDFType(object, "user", User);
    User.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = db.baseURI + "/user/" + self.ddr.username;
    }

    if (isNull(self.ddr.salt))
    {
        const bcrypt = require("bcryptjs");

        if (process.env.NODE_ENV !== "test")
        {
            self.ddr.salt = bcrypt.genSaltSync(10);
        }
        else
        {
            self.ddr.salt = bcrypt.genSaltSync(1);
        }
    }

    return self;
}

User.findByORCID = function (orcid, callback, removePrivateDescriptors)
{
    User.findByPropertyValue(new Descriptor({
        value: orcid,
        prefixedForm: "ddr:orcid"
    }), function (err, user)
    {
        if (isNull(err) && !isNull(user) && user instanceof User)
        {
            if (removePrivateDescriptors)
            {
                user.clearDescriptors([Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.public, Elements.access_types.api_readable]);
                return callback(err, user);
            }
            return callback(err, user);
        }
        return callback(err, user);
    });
};

User.findByUsername = function (username, callback, removeSensitiveDescriptors)
{
    const usernameDescriptor =
        new Descriptor(
            {
                value: username,
                prefixedForm: "ddr:username"
            });

    User.findByPropertyValue(usernameDescriptor, function (err, user)
    {
        if (isNull(err))
        {
            if (!isNull(user) && user instanceof User)
            {
                if (removeSensitiveDescriptors)
                {
                    user.clearDescriptors([Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.public, Elements.access_types.api_readable]);
                    return callback(err, user);
                }
                return callback(err, user);
            }
            return callback(err, null);

            // User.findByPropertyValue(new Descriptor(
            //     {
            //         value : username,
            //         prefixedForm : "ddr:username"
            //     }), function(err, user){
            //     if(isNull(err))
            //     {
            //         if(!isNull(user) && user instanceof User)
            //         {
            //             if(removeSensitiveDescriptors)
            //             {
            //                 console.log(user);
            //             }
            //             else
            //             {
            //                 console.log(user);
            //             }
            //         }
            //         else
            //         {
            //             console.log(user);
            //         }
            //     }
            //     else
            //     {
            //         console.log(user);
            //     }
            // });
            //
            // return;
        }
        return callback(err, user);
    });
};

User.findByEmail = function (email, callback)
{
    User.findByPropertyValue(new Descriptor(
        {
            value: email,
            prefixedForm: "foaf:mbox"
        }), callback);
};

User.autocomplete_search = function (value, maxResults, callback)
{
    if (Config.debug.users.log_fetch_by_username)
    {
        console.log("finding by username " + username);
    }

    const query =
        "SELECT * \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type [1] . \n" +
        "   ?uri foaf:firstName ?firstname . \n" +
        "   ?uri foaf:surname ?surname . \n" +
        "   ?uri ddr:username ?username . \n" +
        "   FILTER (regex(?firstname, [2], [3]) || regex(?surname, [2], [3]) || regex(?username, [2], [3])). \n" +
        "} \n" +
        " LIMIT [4]";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.prefixedResource,
                value: User.leafClass
            },
            {
                type: Elements.types.string,
                value: value
            },
            {
                type: Elements.types.string,
                value: "i"
            },
            {
                type: Elements.types.int,
                value: maxResults
            }
        ],

        function (err, users)
        {
            if (isNull(err) && users instanceof Array)
            {
                const getUserProperties = function (resultRow, cb)
                {
                    User.findByUri(resultRow.uri, function (err, user)
                    {
                        cb(err, user);
                    });
                };

                async.mapSeries(users, getUserProperties, function (err, results)
                {
                    return callback(err, results);
                });
            }
            else
            {
                return callback(err, users);
            }
        });
};

User.createAndInsertFromObject = function (object, callback)
{
    const self = Object.create(this.prototype);
    self.constructor(object);

    // encrypt password
    const bcrypt = require("bcryptjs");
    bcrypt.hash(self.ddr.password, self.ddr.salt, function (err, password)
    {
        if (isNull(err))
        {
            self.ddr.password = password;

            self.save(function (err, newUser)
            {
                if (isNull(err))
                {
                    if (newUser instanceof self.constructor)
                    {
                        return callback(null, newUser);
                    }
                    return callback(err, "The constructor should have returned an instance of User and returned something else: " + typeof newUser);
                }
                return callback(err, newUser);
            });
        }
        else
        {
            return callback(err, password);
        }
    });
};

// User.all = function(callback, req, customGraphUri, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval)
// {
//     const self = this;
//     User.baseConstructor.all.call(self, function(err, users) {
//
//         return callback(err, users);
//
//     }, req, customGraphUri, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval);
// };

User.allInPage = function (page, pageSize, callback)
{
    let query =
        "SELECT ?uri ?firstName ?surname ?username ?email\n" +
        "WHERE \n" +
        "{ \n" +
        " ?uri rdf:type ddr:User . \n" +
        " ?uri foaf:surname ?surname .\n" +
        " ?uri foaf:firstName ?firstName .\n" +
        " ?uri foaf:mbox ?email .\n" +
        " ?uri ddr:username ?username .\n" +
        "} ";

    const skip = pageSize * page;

    if (req.query.pageSize > 0)
    {
        query = query + " LIMIT " + pageSize;
    }

    if (skip > 0)
    {
        query = query + " OFFSET " + skip;
    }

    db.connection.executeViaJDBC(query,
        [],
        function (err, users)
        {
            if (isNull(err))
            {
                if (users instanceof Array)
                {
                    // get all the information about all the projects
                    // and return the array of projects, complete with that info
                    async.mapSeries(users, User.findByUri, function (err, usersToReturn)
                    {
                        if (isNull(err))
                        {
                            return callback(null, usersToReturn);
                        }
                        return callback("error fetching user information : " + err, usersToReturn);
                    });
                }
            }
            else
            {
                return callback(1, users);
            }
        });
};

/**
 * Fetch ontology recommendations for this user
 * @param callback
 */
User.prototype.loadOntologyRecommendations = function (callback)
{
    const self = this;
    if (isNull(self.recommendations))
    {
        self.recommendations = {
            ontologies: {
                accepted: {},
                rejected: {}
            }
        };
    }

    return callback(null, self);
};

/**
 * Save ontology recommendations for this user
 * @param callback
 */
User.prototype.saveOntologyRecommendations = function (callback)
{
    return callback(null,
        {
            accepted: {},
            rejected: {}
        });
};

User.prototype.getInteractions = function (callback)
{
    const self = this;
    const query =
        "SELECT ?interaction ?user ?type ?object ?created\n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        " ?interaction rdf:type ddr:Interaction . \n" +
        " ?interaction ddr:performedBy [1] .\n" +
        " ?interaction ddr:interactionType ?type. \n" +
        " ?interaction ddr:executedOver ?object .\n" +
        " ?interaction ddr:created ?created. \n" +
        "} \n";

    db.connection.executeViaJDBC(query, [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.types.resource,
            value: self.uri
        }
    ], function (err, results)
    {
        if (isNull(err))
        {
            if (!isNull(results) && results instanceof Array)
            {
                const createInteraction = function (result, callback)
                {
                    Interaction.create({
                        uri: result.interaction,
                        ddr: {
                            performedBy: self.uri,
                            interactionType: result.type,
                            executedOver: result.object
                        },
                        dcterms: {
                            created: result.created
                        }
                    }, function (err, fullInteraction)
                    {
                        return callback(err, fullInteraction);
                    });
                };

                async.mapSeries(results, createInteraction, function (err, fullInteractions)
                {
                    return callback(err, fullInteractions);
                });
            }
        }
        else
        {
            return callback(err, results);
        }
    });
};

User.prototype.hiddenDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;

    // TODO FIXME JROCHA necessary to make two queries because something is wrong with virtuoso. making an UNION of both and projecting with SELECT * mixes up the descriptors!

    const createDescriptorsList = function (descriptors, callback)
    {
        const createDescriptor = function (result, callback)
        {
            const suggestion = new Descriptor({
                uri: result.descriptor,
                label: result.label,
                comment: result.comment
            });

            // set recommendation type
            suggestion.recommendation_types = {};

            // TODO JROCHA Figure out under which circumstances this is null
            if (typeof Descriptor.recommendation_types !== "undefined")
            {
                suggestion.recommendation_types[Descriptor.recommendation_types.user_hidden.key] = true;
            }

            suggestion.last_hidden = result.last_hidden;
            suggestion.last_unhidden = Date.parse(result.last_unhidden);

            if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked]))
            {
                return callback(null, suggestion);
            }
            return callback(null, null);
        };

        async.mapSeries(descriptors, createDescriptor, function (err, fullDescriptors)
        {
            if (isNull(err))
            {
                /** remove nulls (that were unauthorized descriptors)**/
                fullDescriptors = _.without(fullDescriptors, null);

                return callback(null, fullDescriptors);
            }
            return callback(1, null);
        });
    };

    let argumentsArray =
    [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: self.uri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: Interaction.types.hide_descriptor_from_quick_list_for_user.key,
            type: Elements.types.string
        },
        {
            value: Interaction.types.unhide_descriptor_from_quick_list_for_user.key,
            type: Elements.types.string
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
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

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "hidden_descriptor");

    const query =
        "SELECT * \n" +
        "{ \n" +
        "	{ \n" +
        "		SELECT ?hidden_descriptor as ?descriptor ?label ?comment ?last_hidden ?last_unhidden \n" +
        fromString + "\n" +
        "		WHERE \n" +
        "		{ \n" +
        "			?hidden_descriptor rdfs:label ?label.  \n" +
        "			?hidden_descriptor rdfs:comment ?comment.  \n" +
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
        filterString + "\n" +
        "			 \n" +
        "			{ \n" +
        "				SELECT ?hidden_descriptor MAX(?date_hidden) as ?last_hidden \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?hide_interaction rdf:type ddr:Interaction. \n" +
        "				   	?hide_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   	?hide_interaction ddr:interactionType [2]. \n" +
        "				   	?hide_interaction ddr:performedBy [1] .  \n" +
        "				   	?hide_interaction ddr:created ?date_hidden. \n" +
        "					FILTER NOT EXISTS \n" +
        "					{ \n" +
        "						SELECT ?unhidden_descriptor MAX(?date_unhidden) as ?last_unhidden \n" +
        "						FROM [0]  \n" +
        "						WHERE  \n" +
        "						{  \n" +
        "				   			?unhide_interaction rdf:type ddr:Interaction. \n" +
        "				   			?unhide_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   			?unhide_interaction ddr:executedOver ?unhidden_descriptor. \n" +
        "				   			?unhide_interaction ddr:interactionType [3]. \n" +
        "				   			?unhide_interaction ddr:performedBy [1] .  \n" +
        "				   			?unhide_interaction ddr:created ?date_unhidden. \n" +
        "						} \n" +
        "					} \n" +
        "				} \n" +
        "			} \n" +
        "		} \n" +
        "	} \n" +
        "	UNION \n" +
        "	{ \n" +
        "		SELECT ?hidden_descriptor as ?descriptor ?label ?comment ?last_hidden ?last_unhidden \n" +
        fromString + "\n" +
        "		WHERE \n" +
        "		{ \n" +
        "			?hidden_descriptor rdfs:label ?label.  \n" +
        "			?hidden_descriptor rdfs:comment ?comment.  \n" +
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
        filterString + "\n" +
        "			 \n" +
        "			{ \n" +
        "				SELECT ?hidden_descriptor MAX(?date_hidden) as ?last_hidden \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?hide_interaction rdf:type ddr:Interaction. \n" +
        "				   	?hide_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   	?hide_interaction ddr:interactionType [2] . \n" +
        "				   	?hide_interaction ddr:performedBy [1] .  \n" +
        "				   	?hide_interaction ddr:created ?date_hidden. \n" +
        "				} \n" +
        "			}. \n" +
        "			{ \n" +
        "				SELECT ?hidden_descriptor MAX(?date_unhidden) as ?last_unhidden \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?unhide_interaction rdf:type ddr:Interaction. \n" +
        "				   	?unhide_interaction ddr:executedOver ?hidden_descriptor. \n" +
        "				   	?unhide_interaction ddr:interactionType [3]. \n" +
        "				   	?unhide_interaction ddr:performedBy [1] .  \n" +
        "				   	?unhide_interaction ddr:created ?date_unhidden. \n" +
        "				} \n" +
        "			} \n" +
        "		   	FILTER(bound(?last_unhidden) && ?last_hidden > ?last_unhidden) \n" +
        "		} \n" +
        "	} \n" +
        "} \n";

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function (err, hidden)
        {
            if (isNull(err))
            {
                createDescriptorsList(hidden, function (err, fullDescriptors)
                {
                    return callback(err, fullDescriptors);
                });
            }
            else
            {
                const msg = "Unable to fetch hidden descriptors of the user " + self.uri + ". Error reported: " + hidden;
                console.log(msg);
                return callback(err, hidden);
            }
        }
    );
};

User.prototype.favoriteDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;

    // TODO FIXME JROCHA necessary to make two queries because something is wrong with virtuoso. making an UNION of both and projecting with SELECT * mixes up the descriptors!

    const createDescriptorsList = function (descriptors, callback)
    {
        const createDescriptor = function (result, callback)
        {
            const suggestion = new Descriptor({
                uri: result.descriptor,
                label: result.label,
                comment: result.comment
            });

            // set recommendation type
            suggestion.recommendation_types = {};

            // TODO JROCHA Figure out under which circumstances this is null
            if (typeof Descriptor.recommendation_types !== "undefined")
            {
                suggestion.recommendation_types[Descriptor.recommendation_types.user_favorite.key] = true;
            }

            suggestion.last_favorited = result.last_favorited;
            suggestion.last_unfavorited = Date.parse(result.last_unfavorited);

            if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked]))
            {
                return callback(null, suggestion);
            }
            return callback(null, null);
        };

        async.mapSeries(descriptors, createDescriptor, function (err, fullDescriptors)
        {
            if (isNull(err))
            {
                /** remove nulls (that were unauthorized descriptors)**/
                fullDescriptors = _.without(fullDescriptors, null);

                return callback(null, fullDescriptors);
            }
            return callback(1, null);
        });
    };

    let argumentsArray =
    [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: self.uri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: Interaction.types.favorite_descriptor_from_quick_list_for_user.key,
            type: Elements.types.string
        },
        {
            value: Interaction.types.unfavorite_descriptor_from_quick_list_for_user.key,
            type: Elements.types.string
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
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

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "favorited_descriptor");

    const query =
        "SELECT * \n" +
        "{ \n" +
        "	{ \n" +
        "		SELECT ?favorited_descriptor as ?descriptor ?label ?comment ?last_favorited ?last_unfavorited \n" +
        fromString + "\n" +
        "		WHERE \n" +
        "		{ \n" +
        "			?favorited_descriptor rdfs:label ?label.  \n" +
        "			?favorited_descriptor rdfs:comment ?comment.  \n" +
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
        filterString + "\n" +
        "			 \n" +
        "			{ \n" +
        "				SELECT ?favorited_descriptor MAX(?date_favorited) as ?last_favorited \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?favorite_interaction rdf:type ddr:Interaction. \n" +
        "				   	?favorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
        "				   	?favorite_interaction ddr:interactionType [2]. \n" +
        "				   	?favorite_interaction ddr:performedBy [1] .  \n" +
        "				   	?favorite_interaction ddr:created ?date_favorited. \n" +
        "					FILTER NOT EXISTS \n" +
        "					{ \n" +
        "						SELECT ?unfavorited_descriptor MAX(?date_unfavorited) as ?last_unfavorited \n" +
        "						FROM [0]  \n" +
        "						WHERE  \n" +
        "						{  \n" +
        "				   			?unfavorite_interaction rdf:type ddr:Interaction. \n" +
        "				   			?unfavorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
        "				   			?unfavorite_interaction ddr:executedOver ?unfavorited_descriptor. \n" +
        "				   			?unfavorite_interaction ddr:interactionType [3]. \n" +
        "				   			?unfavorite_interaction ddr:performedBy [1] .  \n" +
        "				   			?unfavorite_interaction ddr:created ?date_unfavorited. \n" +
        "						} \n" +
        "					} \n" +
        "				} \n" +
        "			} \n" +
        "		} \n" +
        "	} \n" +
        "	UNION \n" +
        "	{ \n" +
        "		SELECT ?favorited_descriptor as ?descriptor ?label ?comment ?last_favorited ?last_unfavorited \n" +
        fromString + "\n" +
        "		WHERE \n" +
        "		{ \n" +
        "			?favorited_descriptor rdfs:label ?label.  \n" +
        "			?favorited_descriptor rdfs:comment ?comment.  \n" +
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n" +
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n" +
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n" +
        filterString + "\n" +
        "			 \n" +
        "			{ \n" +
        "				SELECT ?favorited_descriptor MAX(?date_favorited) as ?last_favorited \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?favorite_interaction rdf:type ddr:Interaction. \n" +
        "				   	?favorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
        "				   	?favorite_interaction ddr:interactionType [2] . \n" +
        "				   	?favorite_interaction ddr:performedBy [1] .  \n" +
        "				   	?favorite_interaction ddr:created ?date_favorited. \n" +
        "				} \n" +
        "			}. \n" +
        "			{ \n" +
        "				SELECT ?favorited_descriptor MAX(?date_unfavorited) as ?last_unfavorited \n" +
        "				FROM [0]  \n" +
        "				WHERE  \n" +
        "				{  \n" +
        "				   	?unfavorite_interaction rdf:type ddr:Interaction. \n" +
        "				   	?unfavorite_interaction ddr:executedOver ?favorited_descriptor. \n" +
        "				   	?unfavorite_interaction ddr:interactionType [3]. \n" +
        "				   	?unfavorite_interaction ddr:performedBy [1] .  \n" +
        "				   	?unfavorite_interaction ddr:created ?date_unfavorited. \n" +
        "				} \n" +
        "			} \n" +
        "		   	FILTER(bound(?last_unfavorited) && ?last_favorited > ?last_unfavorited) \n" +
        "		} \n" +
        "	} \n" +
        "} \n";

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function (err, favorites)
        {
            if (isNull(err))
            {
                createDescriptorsList(favorites, function (err, fullDescriptors)
                {
                    return callback(err, fullDescriptors);
                });
            }
            else
            {
                const msg = "Unable to fetch favorite descriptors of the user " + self.uri + ". Error reported: " + favorites;
                console.log(msg);
                return callback(err, favorites);
            }
        }
    );
};

User.prototype.mostAcceptedFavoriteDescriptorsInMetadataEditor = function (maxResults, callback, allowedOntologies)
{
    const self = this;
    let argumentsArray = [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: Interaction.types.accept_favorite_descriptor_in_metadata_editor.key,
            type: Elements.types.string
        },
        {
            value: self.uri,
            type: Elements.types.resourceNoEscape
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
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

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "accepted_descriptor");

    const query =

        "SELECT ?accepted_descriptor ?times_favorite_accepted_in_md_editor ?label ?comment \n" +
        fromString + "\n" +
        "WHERE \n" +
        "{ \n" +
        "    { \n" +
        "        SELECT ?accepted_descriptor COUNT(?accept_interaction) as ?times_favorite_accepted_in_md_editor \n" +
        "        FROM [0] \n" +
        "        WHERE \n" +
        "        { \n" +
        "            ?accept_interaction ddr:executedOver ?accepted_descriptor. \n" +
        "            ?accept_interaction rdf:type ddr:Interaction. \n" +
        "            ?accept_interaction ddr:interactionType [1]. \n" +
        "            ?accept_interaction ddr:performedBy [2]. \n" +
        "            " + filterString + "\n" +
        "        } \n" +
        "    }. \n" +

        "    ?accepted_descriptor rdfs:label ?label. \n" +
        "    ?accepted_descriptor rdfs:comment ?comment. \n" +

        "    FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "    FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
        "    FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\") \n" +
        "} \n";

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function (err, descriptors)
        {
            if (isNull(err))
            {
                const createDescriptor = function (result, callback)
                {
                    const suggestion = new Descriptor({
                        uri: result.accepted_descriptor,
                        label: result.label,
                        comment: result.comment
                    });

                    // set recommendation type
                    suggestion.recommendation_types = {};

                    // TODO JROCHA Figure out under which circumstances this is null
                    if (typeof Descriptor.recommendation_types !== "undefined")
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.key] = true;
                    }

                    if (result.times_favorite_accepted_in_md_editor <= 0)
                    {
                        console.error("Descriptor " + suggestion.uri + " recommended for acceptance in metadata editor (SMART) with invalid number of usages : " + result.times_favorite_accepted_in_md_editor);
                    }

                    suggestion.times_favorite_accepted_in_md_editor = parseInt(result.times_favorite_accepted_in_md_editor);

                    if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked]))
                    {
                        return callback(null, suggestion);
                    }
                    return callback(null, null);
                };

                async.mapSeries(descriptors, createDescriptor, function (err, fullDescriptors)
                {
                    if (isNull(err))
                    {
                        /** remove nulls (that were unauthorized descriptors)**/
                        fullDescriptors = _.without(fullDescriptors, null);

                        return callback(null, fullDescriptors);
                    }
                    return callback(1, null);
                });
            }
            else
            {
                const util = require("util");
                console.error("Error fetching most accepted favorite descriptors for user " + self.uri + " : " + descriptors);
                return callback(1, descriptors);
            }
        });
};

User.prototype.mostAcceptedSmartDescriptorsInMetadataEditor = function (maxResults, callback, allowedOntologies)
{
    const self = this;
    let argumentsArray = [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        },
        {
            value: Interaction.types.accept_smart_descriptor_in_metadata_editor.key,
            type: Elements.types.string
        },
        {
            value: self.uri,
            type: Elements.types.resourceNoEscape
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
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

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "accepted_descriptor");

    const query =

        "SELECT ?accepted_descriptor ?times_smart_accepted_in_md_editor ?label ?comment \n" +
        fromString + "\n" +
        "WHERE \n" +
        "{ \n" +
        "    { \n" +
        "        SELECT ?accepted_descriptor COUNT(?accept_interaction) as ?times_smart_accepted_in_md_editor \n" +
        "        FROM [0] \n" +
        "        WHERE \n" +
        "        { \n" +
        "            ?accept_interaction ddr:executedOver ?accepted_descriptor. \n" +
        "            ?accept_interaction rdf:type ddr:Interaction. \n" +
        "            ?accept_interaction ddr:interactionType [1]. \n" +
        "            ?accept_interaction ddr:performedBy [2]. \n" +
        "            " + filterString + "\n" +
        "        } \n" +
        "    }. \n" +

        "    ?accepted_descriptor rdfs:label ?label. \n" +
        "    ?accepted_descriptor rdfs:comment ?comment. \n" +

        "    FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "    FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
        "    FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\") \n" +
        "} \n";

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function (err, descriptors)
        {
            if (isNull(err))
            {
                const createDescriptor = function (result, callback)
                {
                    const suggestion = new Descriptor({
                        uri: result.accepted_descriptor,
                        label: result.label,
                        comment: result.comment
                    });

                    // set recommendation type
                    suggestion.recommendation_types = {};

                    // TODO JROCHA Figure out under which circumstances this is null
                    if (typeof Descriptor.recommendation_types !== "undefined")
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.smart_accepted_in_metadata_editor.key] = true;
                    }

                    if (result.times_smart_accepted_in_md_editor <= 0)
                    {
                        console.error("Descriptor " + suggestion.uri + " recommended for acceptance in metadata editor (SMART) with invalid number of usages : " + result.times_smart_accepted_in_md_editor);
                    }

                    suggestion.times_smart_accepted_in_md_editor = parseInt(result.times_smart_accepted_in_md_editor);

                    if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked]))
                    {
                        return callback(null, suggestion);
                    }
                    return callback(null, null);
                };

                async.mapSeries(descriptors, createDescriptor, function (err, fullDescriptors)
                {
                    if (isNull(err))
                    {
                        /** remove nulls (that were unauthorized descriptors)**/
                        fullDescriptors = _.without(fullDescriptors, null);

                        return callback(null, fullDescriptors);
                    }
                    return callback(1, null);
                });
            }
            else
            {
                const util = require("util");
                console.error("Error fetching most accepted smart descriptors for user " + self.uri + " : " + descriptors);
                return callback(1, descriptors);
            }
        });
};

User.prototype.mostRecentlyFilledInDescriptors = function (maxResults, callback, allowedOntologies)
{
    const self = this;
    let argumentsArray = [
        {
            value: db.graphUri,
            type: Elements.types.resourceNoEscape
        }
    ];

    const publicOntologies = Ontology.getPublicOntologiesUris();
    if (!isNull(allowedOntologies) && allowedOntologies instanceof Array)
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

    const filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "descriptor");

    const query =
    "SELECT ?descriptor ?recent_use_count ?last_use ?label ?comment " +
    fromString + "\n" +
    "WHERE \n" +
    "{ \n" +
    "{ \n" +
    "SELECT ?descriptor COUNT(?descriptor) as ?recent_use_count MAX(?used_date) as ?last_use \n" +
    "FROM [0] \n" +
    "WHERE \n" +
    "{ \n" +
    "?change rdf:type ddr:Change. \n" +
    "?change ddr:changedDescriptor ?descriptor. \n" +
    "?change ddr:pertainsTo ?version. \n" +
    "?version rdf:type ddr:ArchivedResource .\n" +
    "?version ddr:versionCreator [" + argumentsArray.length + "] .\n" +

    "OPTIONAL { ?descriptor rdfs:label ?label. }\n" +
    "OPTIONAL { ?descriptor rdfs:comment ?comment. }\n" +
    "?version ddr:created ?used_date. \n" +
    filterString + "\n" +
    "} " +
    "ORDER BY DESC(?last_use) \n" +
    " LIMIT " + maxResults + "\n" +
    "}. \n" +
    "?descriptor rdfs:label ?label. \n" +
    "?descriptor rdfs:comment ?comment. \n" +
    "FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
    "FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
    "FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")  \n" +
    "} \n";

    argumentsArray = argumentsArray.concat([{
        value: self.uri,
        type: Elements.types.resourceNoEscape
    }]);

    db.connection.executeViaJDBC(
        query,
        argumentsArray,

        function (err, descriptors)
        {
            if (isNull(err))
            {
                const createDescriptor = function (result, callback)
                {
                    const suggestion = new Descriptor({
                        uri: result.descriptor,
                        label: result.label,
                        comment: result.comment
                    });

                    // set recommendation type
                    suggestion.recommendation_types = {};

                    // TODO JROCHA Figure out under which circumstances this is null
                    if (typeof Descriptor.recommendation_types !== "undefined")
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.recently_used.key] = true;
                    }

                    if (result.recent_use_count <= 0)
                    {
                        console.error("Descriptor " + suggestion.uri + " recommended for recent use with invalid number of usages : " + result.recent_use_count);
                    }

                    suggestion.recent_use_count = parseInt(result.recent_use_count);
                    suggestion.last_use = Date.parse(result.last_use);

                    if (suggestion instanceof Descriptor && suggestion.isAuthorized([Elements.access_types.private, Elements.access_types.locked]))
                    {
                        return callback(null, suggestion);
                    }
                    return callback(null, null);
                };

                async.mapSeries(descriptors, createDescriptor, function (err, fullDescriptors)
                {
                    if (isNull(err))
                    {
                        /** remove nulls (that were unauthorized descriptors)**/
                        fullDescriptors = _.without(fullDescriptors, null);

                        return callback(null, fullDescriptors);
                    }
                    return callback(1, null);
                });
            }
            else
            {
                const util = require("util");
                console.error("Error fetching most recently filled in descriptors for user " + self.uri);
                return callback(1, descriptors);
            }
        });
};

User.prototype.finishPasswordReset = function (newPassword, token, callback)
{
    const self = this;

    self.checkIfHasPredicateValue("ddr:password_reset_token", token, function (err, tokenIsCorrect)
    {
        if (isNull(err))
        {
            if (tokenIsCorrect)
            {
                const crypto = require("crypto"), shasum = crypto.createHash("sha1");

                shasum.update(newPassword);
                self.ddr.password = shasum.digest("hex");
                self.ddr.password_reset_token = null;

                self.save(function (err, result)
                {
                    if (isNull(err))
                    {
                        console.log("Successfully set new password for user : " + self.uri + ".");
                        return callback(err, result);
                    }
                    console.error("Error setting new password for user : " + self.uri + ". Error reported: " + result);
                    return callback(err, result);
                });
            }
            else
            {
                return callback(1, "Incorrect password reset token");
            }
        }
        else
        {
            return callback(1, "Error checking password reset token: " + tokenIsCorrect);
        }
    });
};

User.prototype.startPasswordReset = function (callback)
{
    const self = this;
    const uuid = require("uuid");

    const token = uuid.v4();

    self.ddr.password_reset_token = token;

    const sendConfirmationEmail = function (callback)
    {
        const nodemailer = require("nodemailer");

        // create reusable transporter object using the default SMTP transport

        const gmailUsername = Config.email.gmail.username;
        const gmailPassword = Config.email.gmail.password;

        const ejs = require("ejs");
        const fs = require("fs");

        const appDir = path.dirname(require.main.filename);

        const emailHTMLFilePath = Pathfinder.absPathInSrcFolder("views/users/password_reset_email.ejs");
        const emailTXTFilePath = path.join(appDir, "views/users/password_reset_email_txt.ejs");

        const file = fs.readFileSync(emailHTMLFilePath, "ascii");
        const fileTXT = fs.readFileSync(emailTXTFilePath, "ascii");

        const rendered = ejs.render(file, {
            locals: {
                user: self,
                url: Config.baseUri,
                token: token,
                email: self.foaf.mbox
            }
        });
        const renderedTXT = ejs.render(fileTXT, {
            locals: {
                user: self,
                url: Config.baseUri,
                token: token,
                email: self.foaf.mbox
            }
        });

        const mailer = require("nodemailer");

        // Use Smtp Protocol to send Email
        const smtpTransport = mailer.createTransport("SMTP", {
            service: "Gmail",
            auth: {
                user: gmailUsername + "@gmail.com",
                pass: gmailPassword
            }
        });

        const mail = {
            from: "Dendro RDM Platform <from@gmail.com>",
            to: self.foaf.mbox + "@gmail.com",
            subject: "Dendro Website password reset instructions",
            text: renderedTXT,
            html: rendered
        };

        smtpTransport.sendMail(mail, function (error, response)
        {
            if (error)
            {
                console.err(error);
            }
            else
            {
                console.log("Password reset sent to " + self.foaf.mbox + "Message sent: " + JSON.stringify(response));
            }

            smtpTransport.close();
            return callback(error, response);
        });
    };

    self.save(function (err, updatedUser)
    {
        if (isNull(err))
        {
            sendConfirmationEmail(callback);
        }
        else
        {
            console.error("Unable to set password reset token for user " + self.uri);
            return callback(err, updatedUser);
        }
    });
};

User.prototype.getAvatarUri = function ()
{
    var self = this;
    if (self.ddr.hasAvatar)
    {
        return self.ddr.hasAvatar;
    }
    var msg = "User has no previously saved Avatar";
    console.error(msg);
    return null;
};

User.prototype.getAvatarFromGridFS = function (callback)
{
    const self = this;
    const tmp = require("tmp");
    const fs = require("fs");
    let avatarUri = self.getAvatarUri();
    if (avatarUri)
    {
        let ext = avatarUri.split(".").pop();

        tmp.dir(
            {
                mode: Config.tempFilesCreationMode,
                dir: Config.tempFilesDir
            },
            function (err, tempFolderPath)
            {
                if (!err)
                {
                    let avatarFilePath = path.join(tempFolderPath, self.ddr.username + "avatarOutput." + ext);
                    let writeStream = fs.createWriteStream(avatarFilePath);

                    gfs.connection.get(avatarUri, writeStream, function (err, result)
                    {
                        if (!err)
                        {
                            writeStream.on("error", function (err)
                            {
                                // console.log("Deu error");
                                callback(err, result);
                            }).on("finish", function ()
                            {
                                // console.log("Deu finish");
                                callback(null, avatarFilePath);
                            });
                        }
                        else
                        {
                            let msg = "Error getting the avatar file from GridFS for user " + self.uri;
                            console.error(msg);
                            return callback(err, msg);
                        }
                    });
                }
                else
                {
                    let msg = "Error when creating a temp dir when getting the avatar from GridFS for self " + self.uri;
                    console.error(msg);
                    return callback(err, msg);
                }
            }
        );
    }
    else
    {
        let msg = "User has no avatar saved in gridFs";
        console.error(msg);
        return callback(true, msg);
    }
};
User.prototype.uploadAvatarToGridFS = function (avatarUri, base64Data, extension, callback)
{
    const self = this;
    const tmp = require("tmp");
    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath)
        {
            if (!err)
            {
                let path = require("path");
                let fs = require("fs");
                let avatarFilePath = path.join(tempFolderPath, "avatar.png");
                fs.writeFile(avatarFilePath, base64Data, "base64", function (error)
                {
                    if (!error)
                    {
                        let readStream = fs.createReadStream(avatarFilePath);
                        readStream.on("open", function ()
                        {
                            // console.log("readStream is ready");
                            gfs.connection.put(
                                avatarUri,
                                readStream,
                                function (err, result)
                                {
                                    if (err)
                                    {
                                        let msg = "Error saving avatar file in GridFS :" + result + " for user " + self.uri;
                                        console.error(msg);
                                        return callback(err, msg);
                                    }
                                    return callback(null, result);
                                },
                                {
                                    self: self.uri,
                                    fileExtension: extension,
                                    type: "nie:File"
                                }
                            );
                        });

                        // This catches any errors that happen while creating the readable stream (usually invalid names)
                        readStream.on("error", function (err)
                        {
                            let msg = "Error creating readStream for avatar :" + err + " for self " + self.uri;
                            console.error(msg);
                            callback(err, msg);
                        });
                    }
                    else
                    {
                        let msg = "Error when creating a temp file for the avatar upload";
                        console.error(msg);
                        return callback(error, msg);
                    }
                });
            }
            else
            {
                let msg = "Error when creating a temp dir for the avatar upload";
                console.error(msg);
                return callback(err, msg);
            }
        }
    );
};
User.prototype.saveAvatarInGridFS = function (avatar, extension, callback)
{
    const self = this;
    let avatarUri = "/avatar/" + self.ddr.username + "/avatar." + extension;
    let base64Data = avatar.replace(/^data:image\/png;base64,/, "");

    let mongoClient = new DendroMongoClient(Config.mongoDBHost, Config.mongoDbPort, Config.mongoDbCollectionName);

    mongoClient.connect(function (err, mongoDb)
    {
        if (!err && !isNull(mongoDb))
        {
            mongoClient.findFileByFilenameOrderedByDate(mongoDb, avatarUri, function (err, files)
            {
                if (!err)
                {
                    if (files.length > 0)
                    {
                        async.mapSeries(files, function (file, callback)
                        {
                            gfs.connection.deleteAvatar(file._id, function (err, result)
                            {
                                callback(err, result);
                            });
                        }, function (err, results)
                        {
                            if (err)
                            {
                                console.error("Error deleting one of the old avatars");
                                // console.error(JSON.stringify(results));
                            }
                            self.uploadAvatarToGridFS(avatarUri, base64Data, extension, function (err, data)
                            {
                                callback(err, data);
                            });
                        });
                    }
                    else
                    {
                        self.uploadAvatarToGridFS(avatarUri, base64Data, extension, function (err, data)
                        {
                            callback(err, data);
                        });
                    }
                }
                else
                {
                    let msg = "Error when finding the latest file with uri : " + avatarUri + " in Mongo";
                    console.error(msg);
                    return callback(err, msg);
                }
            });
        }
        else
        {
            let msg = "Error when connencting to mongodb, error: " + JSON.stringify(err);
            console.error(msg);
            return callback(err, msg);
        }
    });
};

User.removeAllAdmins = function (callback)
{
    const adminDescriptor = new Descriptor({
        prefixedForm: "rdf:type",
        value: "ddr:Administrator"
    });

    Resource.deleteAllWithCertainDescriptorValueAndTheirOutgoingTriples(adminDescriptor, function (err, results)
    {
        if (isNull(err))
        {
            return callback(null, results);
        }
        const msg = "Error deleting all administrators: " + results;
        console.error(msg);
        return callback(1, msg);
    });
};

User.anonymous = {
    uri: "http://dendro.fe.up.pt/user/anonymous"
};

User = Class.extend(User, Resource, "ddr:User");

module.exports.User = User;
