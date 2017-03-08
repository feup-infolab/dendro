var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;

var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

function User (object)
{
    User.baseConstructor.call(this, object);
    var self = this;

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/user/"+self.ddr.username;
    }

    if(self.ddr.salt == null)
    {
        var bcrypt = require('bcrypt');
        self.ddr.salt = bcrypt.genSaltSync(10);
    }

    self.rdf.type = "ddr:User";

    return self;
}

User.findByUsername = function(username, callback, removePrivateDescriptors)
{
    User.findByPropertyValue(username, "ddr:username", function(err, user){
        if(!err && user != null)
        {
            if(removePrivateDescriptors)
            {
                user.clearDescriptorTypesInMemory([Config.types.private, Config.types.locked], [Config.types.api_readable]);
                callback(err, user);
            }
            else
            {
                callback(err, user);
            }
        }
        else
        {
            callback(err, user);
        }
    });
};

User.findByEmail = function(email, callback)
{
    User.findByPropertyValue(email, "foaf:mbox", callback);
};

User.autocomplete_search = function(value, maxResults, callback) {

    if(Config.debug.users.log_fetch_by_username)
    {
        console.log("finding by username " + username);
    }

    var query =
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


    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.prefixedResource,
                value : User.prefixedRDFType
            },
            {
                type : DbConnection.string,
                value : value
            },
            {
                type : DbConnection.string,
                value : "i"
            },
            {
                type : DbConnection.int,
                value : maxResults
            }
        ],

        function(err, users) {
            if(!err && users instanceof Array)
            {
                var getUserProperties = function(resultRow, cb)
                {
                    User.findByUri(resultRow.uri, function(err, user)
                    {
                        cb(err, user);
                    });
                };

                async.map(users, getUserProperties, function(err, results){
                    callback(err, results);
                })
            }
            else
            {
                callback(err, user);
            }
        });
};

User.findByPropertyValue = function(value, propertyInPrefixedForm, callback) {

    if(Config.debug.users.log_fetch_by_username)
    {
        console.log("finding by username " + username);
    }

    var query =
            "SELECT * \n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
                " ?uri [1] [2] . \n" +
            "} \n";


    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.prefixedResource,
                value : propertyInPrefixedForm
            },
            {
                type : DbConnection.string,
                value : value
            }
        ],

        function(err, user) {
            if(!err)
            {
                if(user.length > 1)
                {
                    console.log("Duplicate username "+username+" found!!!!")
                }

                else if(user.length == 1)
                {
                    var uri = user[0].uri;
                    User.findByUri(uri, function(err, fetchedUser)
                    {
                        if(!err)
                        {
                            var userToReturn = new User(fetchedUser);

                            callback(err, fetchedUser);

                            /*userToReturn.loadOntologyRecommendations(function(err, user){

                            });*/
                        }
                        else
                        {
                            callback(1, "Unable to fetch user with uri :" + uri + ". Error reported : " + fetchedUser);
                        }
                    });
                }
                else
                {
                    callback(0,null);
                }
            }
            else
            {
                callback(err, user);
            }
        });
};

User.createAndInsertFromObject = function(object, callback) {

    var self = new User(object);

    console.log("creating user from object" + util.inspect(object));

    //encrypt password
    var bcrypt = require('bcrypt');
    self.ddr.password = bcrypt.hashSync(self.ddr.password, self.ddr.salt);

    //TODO CACHE DONE

    self.save(function(err, newUser) {
            if(!err)
            {
                if(newUser instanceof User)
                {
                    callback(null, self);
                }
                else
                {
                    callback(null, false);
                }
            }
            else
            {
                callback(err, newUser);
            }
        });
};


User.all = function(callback, req, customGraphUri, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval)
{
    var self = this;
    User.baseConstructor.all.call(self, function(err, users) {

        callback(err, users);

    }, req, customGraphUri, descriptorTypesToRemove, descriptorTypesToExemptFromRemoval);
};

User.allInPage = function(page, pageSize, callback) {
    var query =
            "SELECT ?uri ?firstName ?surname ?username ?email\n" +
            "WHERE \n" +
            "{ \n" +
            " ?uri rdf:type ddr:User . \n" +
            " ?uri foaf:surname ?surname .\n" +
            " ?uri foaf:firstName ?firstName .\n" +
            " ?uri foaf:mbox ?email .\n" +
            " ?uri ddr:username ?username .\n" +
            "} ";

    var skip = pageSize * page;

    if(req.query.pageSize > 0)
    {
        query = query + " LIMIT " + pageSize;
    }

    if(skip > 0)
    {
        query = query + " OFFSET " + skip;
    }

    db.connection.execute(query,
        [],
        function(err, users) {
            if(!err)
            {
                if(users instanceof Array)
                {
                    //get all the information about all the projects
                    // and return the array of projects, complete with that info
                    async.map(users, User.findByUri, function(err, usersToReturn)
                    {
                        if(!err)
                        {
                            callback(null, usersToReturn);
                        }
                        else
                        {
                            callback("error fetching user information : " + err, usersToReturn);
                        }
                    });
                }
            }
            else
            {
                callback(1, users);
            }
        });
};

/**
 * Fetch ontology recommendations for this user
 * @param callback
 */
User.prototype.loadOntologyRecommendations = function(callback)
{
    var self = this;
    if(self.recommendations == null)
    {
        self.recommendations = {
            ontologies : {
                accepted : {},
                rejected : {}
            }
        };
    }

    callback(null, self);
}

/**
 * Save ontology recommendations for this user
 * @param callback
 */
User.prototype.saveOntologyRecommendations = function(callback)
{
    callback(null,
        {
            accepted : {},
            rejected : {}
        });
};

User.prototype.getInteractions = function(callback)
{
    var self = this;
    var query =
            "SELECT ?interaction ?user ?type ?object ?created\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            " ?interaction rdf:type ddr:Interaction . \n" +
            " ?interaction ddr:performedBy [1] .\n" +
            " ?interaction ddr:interactionType ?type. \n" +
            " ?interaction ddr:executedOver ?object .\n" +
            " ?interaction dcterms:created ?created. \n" +
            "} \n";

    db.connection.execute(query, [
        {
            type: DbConnection.resourceNoEscape,
            value : db.graphUri
        },
        {
            type : DbConnection.resource,
            value : self.uri
        }
    ], function(err, results) {
        if(!err)
        {
            if(results != null && results instanceof Array)
            {
                var createInteraction = function(result, callback)
                {
                    new Interaction({
                        uri : result.interaction,
                        ddr :
                        {
                            performedBy : self.uri,
                            interactionType : result.type,
                            executedOver : result.object
                        },
                        dcterms :
                        {
                            created : result.created
                        }
                    },function(err, fullInteraction){
                        callback(err, fullInteraction);
                    });
                };

                async.map(results, createInteraction, function(err, fullInteractions)
                {
                    callback(err, fullInteractions);
                });
            }
        }
        else
        {
            callback(err, results);
        }
    });
};

User.prototype.hiddenDescriptors = function(maxResults, callback, allowedOntologies)
{
    var self = this;

    //TODO FIXME JROCHA necessary to make two queries because something is wrong with virtuoso. making an UNION of both and projecting with SELECT * mixes up the descriptors!

    var createDescriptorsList = function(descriptors, callback)
    {
        var createDescriptor = function(result, callback){
            var suggestion = new Descriptor({
                uri : result.descriptor,
                label : result.label,
                comment : result.comment
            });


            //set recommendation type
            suggestion.recommendation_types = {};

            //TODO JROCHA Figure out under which circumstances this is null
            if(Descriptor.recommendation_types != null)
            {
                suggestion.recommendation_types[Descriptor.recommendation_types.user_hidden.key] = true;
            }

            suggestion.last_hidden = result.last_hidden;
            suggestion.last_unhidden = Date.parse(result.last_unhidden);

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
    };

    var argumentsArray =
        [
            {
                value : db.graphUri,
                type : DbConnection.resourceNoEscape
            },
            {
                value : self.uri,
                type : DbConnection.resourceNoEscape
            },
            {
                value : Interaction.types.hide_descriptor_from_quick_list_for_user.key,
                type : DbConnection.string
            },
            {
                value : Interaction.types.unhide_descriptor_from_quick_list_for_user.key,
                type : DbConnection.string
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

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "hidden_descriptor");

    var query =
        "SELECT * \n"+
        "{ \n"+
        "	{ \n"+
        "		SELECT ?hidden_descriptor as ?descriptor ?label ?comment ?last_hidden ?last_unhidden \n"+
                fromString + "\n" +
        "		WHERE \n"+
        "		{ \n"+
        "			?hidden_descriptor rdfs:label ?label.  \n"+
        "			?hidden_descriptor rdfs:comment ?comment.  \n"+
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n"+
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n"+
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n"+
                    filterString + "\n" +
        "			 \n"+
        "			{ \n"+
        "				SELECT ?hidden_descriptor MAX(?date_hidden) as ?last_hidden \n"+
        "				FROM [0]  \n"+
        "				WHERE  \n"+
        "				{  \n"+
        "				   	?hide_interaction rdf:type ddr:Interaction. \n"+
        "				   	?hide_interaction ddr:executedOver ?hidden_descriptor. \n"+
        "				   	?hide_interaction ddr:interactionType [2]. \n"+
        "				   	?hide_interaction ddr:performedBy [1] .  \n"+
        "				   	?hide_interaction dcterms:created ?date_hidden. \n"+
        "					FILTER NOT EXISTS \n"+
        "					{ \n"+
        "						SELECT ?unhidden_descriptor MAX(?date_unhidden) as ?last_unhidden \n"+
        "						FROM [0]  \n"+
        "						WHERE  \n"+
        "						{  \n"+
        "				   			?unhide_interaction rdf:type ddr:Interaction. \n"+
        "				   			?unhide_interaction ddr:executedOver ?hidden_descriptor. \n"+
        "				   			?unhide_interaction ddr:executedOver ?unhidden_descriptor. \n"+
        "				   			?unhide_interaction ddr:interactionType [3]. \n" +
        "				   			?unhide_interaction ddr:performedBy [1] .  \n" +
        "				   			?unhide_interaction dcterms:created ?date_unhidden. \n" +
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
        "				   	?hide_interaction dcterms:created ?date_hidden. \n" +
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
        "				   	?unhide_interaction dcterms:created ?date_unhidden. \n" +
        "				} \n" +
        "			} \n" +
        "		   	FILTER(bound(?last_unhidden) && ?last_hidden > ?last_unhidden) \n" +
        "		} \n" +
        "	} \n" +
        "} \n";

    db.connection.execute(
        query,
        argumentsArray,

        function(err, hidden) {
            if(!err)
            {
                createDescriptorsList(hidden, function(err, fullDescriptors){
                    callback(err, fullDescriptors);
                });
            }
            else
            {
                var msg = "Unable to fetch hidden descriptors of the user " + self.uri + ". Error reported: " + hidden;
                console.log(msg);
                callback(err, hidden);
            }
        }
    );
};

User.prototype.favoriteDescriptors = function(maxResults, callback, allowedOntologies)
{
    var self = this;

    //TODO FIXME JROCHA necessary to make two queries because something is wrong with virtuoso. making an UNION of both and projecting with SELECT * mixes up the descriptors!

    var createDescriptorsList = function(descriptors, callback)
    {
        var createDescriptor = function(result, callback){
            var suggestion = new Descriptor({
                uri : result.descriptor,
                label : result.label,
                comment : result.comment
            });


            //set recommendation type
            suggestion.recommendation_types = {};

            //TODO JROCHA Figure out under which circumstances this is null
            if(Descriptor.recommendation_types != null)
            {
                suggestion.recommendation_types[Descriptor.recommendation_types.user_favorite.key] = true;
            }

            suggestion.last_favorited = result.last_favorited;
            suggestion.last_unfavorited = Date.parse(result.last_unfavorited);

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
    };

    var argumentsArray =
        [
            {
                value : db.graphUri,
                type : DbConnection.resourceNoEscape
            },
            {
                value : self.uri,
                type : DbConnection.resourceNoEscape
            },
            {
                value : Interaction.types.favorite_descriptor_from_quick_list_for_user.key,
                type : DbConnection.string
            },
            {
                value : Interaction.types.unfavorite_descriptor_from_quick_list_for_user.key,
                type : DbConnection.string
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

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "favorited_descriptor");

    var query =
        "SELECT * \n"+
        "{ \n"+
        "	{ \n"+
        "		SELECT ?favorited_descriptor as ?descriptor ?label ?comment ?last_favorited ?last_unfavorited \n"+
                fromString + "\n" +
        "		WHERE \n"+
        "		{ \n"+
        "			?favorited_descriptor rdfs:label ?label.  \n"+
        "			?favorited_descriptor rdfs:comment ?comment.  \n"+
        "			FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ).  \n"+
        "			FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") .  \n"+
        "			FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")   \n"+
                    filterString + "\n" +
        "			 \n"+
        "			{ \n"+
        "				SELECT ?favorited_descriptor MAX(?date_favorited) as ?last_favorited \n"+
        "				FROM [0]  \n"+
        "				WHERE  \n"+
        "				{  \n"+
        "				   	?favorite_interaction rdf:type ddr:Interaction. \n"+
        "				   	?favorite_interaction ddr:executedOver ?favorited_descriptor. \n"+
        "				   	?favorite_interaction ddr:interactionType [2]. \n"+
        "				   	?favorite_interaction ddr:performedBy [1] .  \n"+
        "				   	?favorite_interaction dcterms:created ?date_favorited. \n"+
        "					FILTER NOT EXISTS \n"+
        "					{ \n"+
        "						SELECT ?unfavorited_descriptor MAX(?date_unfavorited) as ?last_unfavorited \n"+
        "						FROM [0]  \n"+
        "						WHERE  \n"+
        "						{  \n"+
        "				   			?unfavorite_interaction rdf:type ddr:Interaction. \n"+
        "				   			?unfavorite_interaction ddr:executedOver ?favorited_descriptor. \n"+
        "				   			?unfavorite_interaction ddr:executedOver ?unfavorited_descriptor. \n"+
        "				   			?unfavorite_interaction ddr:interactionType [3]. \n" +
        "				   			?unfavorite_interaction ddr:performedBy [1] .  \n" +
        "				   			?unfavorite_interaction dcterms:created ?date_unfavorited. \n" +
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
        "				   	?favorite_interaction dcterms:created ?date_favorited. \n" +
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
        "				   	?unfavorite_interaction dcterms:created ?date_unfavorited. \n" +
        "				} \n" +
        "			} \n" +
        "		   	FILTER(bound(?last_unfavorited) && ?last_favorited > ?last_unfavorited) \n" +
        "		} \n" +
        "	} \n" +
        "} \n";

    db.connection.execute(
        query,
        argumentsArray,

        function(err, favorites) {
            if(!err)
            {
                createDescriptorsList(favorites, function(err, fullDescriptors){
                    callback(err, fullDescriptors);
                });
            }
            else
            {
                var msg = "Unable to fetch favorite descriptors of the user " + self.uri + ". Error reported: " + favorites;
                console.log(msg);
                callback(err, favorites);
            }
        }
    );
};

User.prototype.mostAcceptedFavoriteDescriptorsInMetadataEditor = function(maxResults, callback, allowedOntologies)
{
    var self = this;
    var argumentsArray = [
        {
            value : db.graphUri,
            type : DbConnection.resourceNoEscape
        },
        {
            value : Interaction.types.accept_favorite_descriptor_in_metadata_editor.key,
            type : DbConnection.string
        },
        {
            value : self.uri,
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

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "accepted_descriptor");

    var query =

        "SELECT ?accepted_descriptor ?times_favorite_accepted_in_md_editor ?label ?comment \n"+
        fromString + "\n" +
        "WHERE \n"+
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
        "            "+filterString +"\n" +
        "        } \n" +
        "    }. \n" +

        "    ?accepted_descriptor rdfs:label ?label. \n" +
        "    ?accepted_descriptor rdfs:comment ?comment. \n" +

        "    FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "    FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
        "    FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\") \n" +
        "} \n";

    db.connection.execute(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(!err)
            {
                var createDescriptor = function(result, callback){

                    var suggestion = new Descriptor({
                        uri : result.accepted_descriptor,
                        label : result.label,
                        comment : result.comment
                    });

                    //set recommendation type
                    suggestion.recommendation_types = {};

                    //TODO JROCHA Figure out under which circumstances this is null
                    if(Descriptor.recommendation_types != null)
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.favorite_accepted_in_metadata_editor.key] = true;
                    }

                    if(result.times_favorite_accepted_in_md_editor <= 0)
                    {
                        console.error("Descriptor "+ suggestion.uri + " recommended for acceptance in metadata editor (SMART) with invalid number of usages : " + result.times_favorite_accepted_in_md_editor);
                    }

                    suggestion.times_favorite_accepted_in_md_editor = parseInt(result.times_favorite_accepted_in_md_editor);

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
                console.error("Error fetching most accepted favorite descriptors for user " + self.uri + " : " + descriptors);
                callback(1, descriptors);
            }
        });
};

User.prototype.mostAcceptedSmartDescriptorsInMetadataEditor = function(maxResults, callback, allowedOntologies)
{
    var self = this;
    var argumentsArray = [
        {
            value : db.graphUri,
            type : DbConnection.resourceNoEscape
        },
        {
            value : Interaction.types.accept_smart_descriptor_in_metadata_editor.key,
            type : DbConnection.string
        },
        {
            value : self.uri,
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

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "accepted_descriptor");

    var query =

        "SELECT ?accepted_descriptor ?times_smart_accepted_in_md_editor ?label ?comment \n"+
        fromString + "\n" +
        "WHERE \n"+
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
        "            "+filterString +"\n" +
        "        } \n" +
        "    }. \n" +

        "    ?accepted_descriptor rdfs:label ?label. \n" +
        "    ?accepted_descriptor rdfs:comment ?comment. \n" +

        "    FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n" +
        "    FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
        "    FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\") \n" +
        "} \n";

    db.connection.execute(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(!err)
            {
                var createDescriptor = function(result, callback){

                    var suggestion = new Descriptor({
                        uri : result.accepted_descriptor,
                        label : result.label,
                        comment : result.comment
                    });

                    //set recommendation type
                    suggestion.recommendation_types = {};

                    //TODO JROCHA Figure out under which circumstances this is null
                    if(Descriptor.recommendation_types != null)
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.smart_accepted_in_metadata_editor.key] = true;
                    }

                    if(result.times_smart_accepted_in_md_editor <= 0)
                    {
                        console.error("Descriptor "+ suggestion.uri + " recommended for acceptance in metadata editor (SMART) with invalid number of usages : " + result.times_smart_accepted_in_md_editor);
                    }

                    suggestion.times_smart_accepted_in_md_editor = parseInt(result.times_smart_accepted_in_md_editor);

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
                console.error("Error fetching most accepted smart descriptors for user " + self.uri + " : " + descriptors);
                callback(1, descriptors);
            }
        });
};

User.prototype.mostRecentlyFilledInDescriptors = function(maxResults, callback, allowedOntologies)
{
    var self = this;
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

    var filterString = DbConnection.buildFilterStringForOntologies(allowedOntologies, "descriptor");

    var query =
    "SELECT ?descriptor ?recent_use_count ?last_use ?label ?comment "+
    fromString + "\n" +
    "WHERE \n" +
    "{ \n" +
        "{ \n"+
            "SELECT ?descriptor COUNT(?descriptor) as ?recent_use_count MAX(?used_date) as ?last_use \n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
                "?change rdf:type ddr:Change. \n" +
                "?change ddr:changedDescriptor ?descriptor. \n" +
                "?change ddr:pertainsTo ?version. \n" +
                "?version rdf:type ddr:ArchivedResource .\n" +
                "?version ddr:versionCreator ["+argumentsArray.length+"] .\n" +

                "OPTIONAL { ?descriptor rdfs:label ?label. }\n" +
                "OPTIONAL { ?descriptor rdfs:comment ?comment. }\n" +
                "?version dcterms:created ?used_date. \n" +
                filterString + "\n" +
            "} " +
            "ORDER BY DESC(?last_use) \n"+
            " LIMIT "+ maxResults + "\n" +
        "}. \n" +
        "?descriptor rdfs:label ?label. \n" +
        "?descriptor rdfs:comment ?comment. \n" +
        "FILTER(    (str(?label) != \"\") && ( str(?comment) != \"\") ). \n"+
        "FILTER(   lang(?label) = \"\" || lang(?label) = \"en\") . \n" +
        "FILTER(   lang(?comment) = \"\" || lang(?comment) = \"en\")  \n" +
    "} \n";

    argumentsArray = argumentsArray.concat([{
        value : self.uri,
        type : DbConnection.resourceNoEscape
    }]);

    db.connection.execute(
        query,
        argumentsArray,

        function(err, descriptors) {
            if(!err)
            {
                var createDescriptor = function(result, callback){

                    var suggestion = new Descriptor({
                        uri : result.descriptor,
                        label : result.label,
                        comment : result.comment
                    });

                    //set recommendation type
                    suggestion.recommendation_types = {};

                    //TODO JROCHA Figure out under which circumstances this is null
                    if(Descriptor.recommendation_types != null)
                    {
                        suggestion.recommendation_types[Descriptor.recommendation_types.recently_used.key] = true;
                    }

                    if(result.recent_use_count <= 0)
                    {
                        console.error("Descriptor "+ suggestion.uri + " recommended for recent use with invalid number of usages : " + result.recent_use_count);
                    }

                    suggestion.recent_use_count = parseInt(result.recent_use_count);
                    suggestion.last_use = Date.parse(result.last_use);

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
                console.error("Error fetching most recently filled in descriptors for user " + self.uri);
                callback(1, descriptors);
            }
        });
};

User.prototype.isAdmin = function(callback)
{
    var self = this;

    if(typeof callback == "function")
    {
        self.checkIfHasPredicateValue("rdf:type", "ddr:Administrator", function(err, isAdmin)
        {
            callback(err, isAdmin);
        });
    }
    else
    {
        if(_.contains(self.rdf.type, "ddr:Administrator"))
        {
            return true;
        }
        else
        {
            return false;
        }
    }

};

User.prototype.makeGlobalAdmin = function(callback)
{
    var self = this;

    self.isAdmin(function(err, isAdmin){
        if(!err)
        {
            if(!isAdmin)
            {
                var newAdminDescriptor = new Descriptor({
                    prefixedForm : "rdf:type",
                    type : DbConnection.prefixedResource,
                    value : "ddr:Administrator"
                });

                self.insertDescriptors([newAdminDescriptor], function(err, result){
                    if(!err)
                    {
                        callback(null, self);
                    }
                    else
                    {
                        var msg = "Error setting "+ self.uri + " as global admin : " + result;
                        console.error(msg);
                        callback(1, msg);
                    }

                });
            }
            else
            {
                var msg = "User " + self.uri + " is already an admin, nothing to be done.";
                console.error(msg);
                callback(0, msg);
            }
        }
        else
        {
            var msg = "Error seeing if "+ self.uri + " is global admin : " + isAdmin;
            console.error(msg);
            callback(1, msg);
        }
    });
};

User.prototype.undoGlobalAdmin = function(callback)
{
    var self = this;

    self.checkIfHasPredicateValue("rdf:type", "ddr:Administrator", function(err, isAdmin){
        if(!err)
        {
            if (isAdmin)
            {
                self.deleteDescriptorTriples("rdf:type", function(err, result){
                    callback(err, result);
                }, "ddr:Administrator");
            }
            else
            {
                var msg = "User " + self.uri + " is not admin, no need to remove the triples.";
                console.error(msg);
                callback(0, msg);
            }
        }
        else
        {
            var msg = "Error seeing if "+ self.uri + " is global admin : " + isAdmin;
            console.error(msg);
            callback(1, msg);
        }
    })
};

User.prototype.finishPasswordReset = function(newPassword, token, callback)
{
    var self = this;

    self.checkIfHasPredicateValue("ddr:password_reset_token", token, function(err, tokenIsCorrect)
    {
        if(!err)
        {
            if(tokenIsCorrect)
            {
                var crypto = require('crypto')
                    , shasum = crypto.createHash('sha1');

                shasum.update(newPassword);
                self.ddr.password = shasum.digest('hex');
                self.ddr.password_reset_token = null;

                self.save(function(err, result){
                    if(!err)
                    {
                        console.log("Successfully set new password for user : " + self.uri + ".");
                        callback(err, result);
                    }
                    else
                    {
                        console.error("Error setting new password for user : " + self.uri + ". Error reported: " + result);
                        callback(err, result);
                    }
                });
            }
            else
            {
                callback(1, "Incorrect password reset token");
            }
        }
        else
        {
            callback(1, "Error checking password reset token: " + tokenIsCorrect);
        }
    });
};

User.prototype.startPasswordReset = function(callback)
{
    var self = this;
    var uuid = require('node-uuid');

    var token = uuid.v4();

    self.ddr.password_reset_token = token;

    var sendConfirmationEmail = function(callback)
    {
        var nodemailer = require('nodemailer');

        // create reusable transporter object using the default SMTP transport

        var gmailUsername = Config.email.gmail.username;
        var gmailPassword = Config.email.gmail.password;

        var ejs = require('ejs');
        var fs = require('fs');


        var appDir = path.dirname(require.main.filename);

        var emailHTMLFilePath = Config.absPathInSrcFolder('views/users/password_reset_email.ejs');
        var emailTXTFilePath = path.join(appDir, 'views/users/password_reset_email_txt.ejs');

        var file = fs.readFileSync(emailHTMLFilePath, 'ascii');
        var fileTXT = fs.readFileSync(emailTXTFilePath, 'ascii');

        var rendered = ejs.render(file, { locals: { 'user': self, 'url' : Config.baseUri , token: token, email : self.foaf.mbox} });
        var renderedTXT = ejs.render(fileTXT, { locals: { 'user': self, 'url' : Config.baseUri , token : token, email : self.foaf.mbox} });

        var mailer = require("nodemailer");

        // Use Smtp Protocol to send Email
        var smtpTransport = mailer.createTransport("SMTP",{
            service: "Gmail",
            auth: {
                user: gmailUsername+"@gmail.com",
                pass: gmailPassword
            }
        });

        var mail = {
            from: "Dendro RDM Platform <from@gmail.com>",
            to: self.foaf.mbox+"@gmail.com",
            subject: "Dendro Website password reset instructions",
            text: renderedTXT,
            html: rendered
        };

        smtpTransport.sendMail(mail, function(error, response){
            if(error){
                console.err(error);
            }
            else
            {
                console.log('Password reset sent to '+self.foaf.mbox+'Message sent: ' + JSON.stringify(response));
            }

            smtpTransport.close();
            callback(error, response);
        });
    };

    self.save(function(err, updatedUser){
        if(!err)
        {
            sendConfirmationEmail(callback)
        }
        else
        {
            console.error("Unable to set password reset token for user " + self.uri);
            callback(err, updatedUser);
        }
    });
};

User.removeAllAdmins = function(callback)
{
    var adminDescriptor = new Descriptor({
        prefixedForm: "rdf:type",
        value : "ddr:Administrator"
    });

    Resource.deleteAllWithCertainDescriptorValueAndTheirOutgoingTriples(adminDescriptor, function(err, results)
    {
        if (!err)
        {
            callback(0, results);
        }
        else
        {
            var msg = "Error deleting all administrators: " + results;
            console.error(msg);
            callback(1, msg);
        }
    });
};

User.anonymous = {
    uri: "http://dendro.fe.up.pt/user/anonymous"
};

User.prefixedRDFType = "ddr:User";

User = Class.extend(User, Resource);

module.exports.User = User;
