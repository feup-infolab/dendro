var Config = function() { return GLOBAL.Config; }();
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

var moment = require('moment');
var async = require('async');
var db = function() { return GLOBAL.db.default; }();

var mysql = function() {
    return GLOBAL.mysql.connection;
};

function Interaction (object, callback)
{
    Interaction.baseConstructor.call(this, object);
    var self = this;

    self.rdf.type = "ddr:Interaction";

    var now = new Date();

    if(object.dcterms == null)
    {
        self.dcterms = {
            created : now.toISOString()
        }
    }
    else
    {
        if(object.dcterms.created == null)
        {
            self.dcterms.created = now.toISOString();
        }
        else
        {
            self.dcterms.created = object.dcterms.created;
        }
    }

    if(self.uri == null)
    {
        var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
        if(self.ddr.performedBy instanceof Object)
        {
            self.uri = db.baseURI+"/user/"+self.ddr.performedBy.ddr.username+"/interaction/"+self.dcterms.created;
            callback(null, self);
        }
        else if(typeof self.ddr.performedBy === "string")
        {
            User.findByUri(self.ddr.performedBy, function(err, user){
               if(!err && user != null)
               {
                   self.uri = db.baseURI+"/user/"+user.ddr.username+"/interaction/"+self.dcterms.created;
                   callback(null, self);
               }
               else
               {
                    callback(1, "Unable to fetch user with uri " + self.ddr.performedBy);
               }
            });
        }
        else
        {
            callback(1, "no author user specified for interaction. " + self.ddr.performedBy);
        }
    }
    else
    {
        callback(0, self);
    }
}

Interaction.all = function(callback, streaming, customGraphUri) {

    var graphUri = (customGraphUri != null && typeof customGraphUri == "string")? customGraphUri : db.graphUri;

    var getFullInteractions = function(interactions, callback)
    {
        var getInteractionInformation = function(interaction, callback)
        {
            Interaction.findByUri(interaction.uri, callback, null, customGraphUri);
        };

        // get all the information about all the interaction
        // and return the array of interactions, complete with that info
        async.map(interactions, getInteractionInformation, function(err, interactionsToReturn)
        {
            if(!err)
            {
                callback(null, interactionsToReturn);
            }
            else
            {
                callback(err, "error fetching interaction information : " + err  + "error reported: " + interactionsToReturn);
            }
        });
    };

    if(streaming == null || !streaming)
    {
        var query =
            "SELECT * " +
            "FROM [0] "+
            "WHERE " +
            "{ " +
            " ?uri rdf:type ddr:Interaction " +
            "} ";

        db.connection.execute(query,
            [
                {
                    type: DbConnection.resourceNoEscape,
                    value: graphUri
                }
            ],

            function(err, interactions) {
                if(!err && interactions instanceof Array)
                {
                    getFullInteractions(interactions, function(err, interactions){
                        if(!err)
                        {
                            callback(null, interactions);
                        }
                        else
                        {
                            callback(err, interactions);
                        }
                    });
                }
                else
                {
                    //interactions var will contain an error message instead of an array of results.
                    callback(err, interactions);
                }
            });
    }
    else
    {
        var query =
            "SELECT COUNT (?uri) as ?n_interactions " +
            "FROM [0] " +
            "WHERE " +
            "{ " +
            " ?uri rdf:type ddr:Interaction " +
            "} ";

        db.connection.execute(query,
            [
                {
                    type: DbConnection.resourceNoEscape,
                    value: graphUri
                }
            ],

            function (err, result)
            {
                if (!err && result instanceof Array && result.length == 1)
                {
                    var count = result[0].n_interactions;
                    var n_pages = Math.ceil(count / Config.streaming.db.page_size);
                    var pageNumbersArray = [];

                    for (var i = 0; i <= n_pages; i++)
                    {
                        pageNumbersArray.push(i);
                    }

                    async.mapLimit(pageNumbersArray, Config.recommendation.max_interaction_pushing_threads, function (pageNumber, cb)
                    {
                        console.log("Sending page " + pageNumber + " of " + n_pages);

                        var pageOffset = pageNumber * Config.streaming.db.page_size;

                        /**
                         * TODO Replace with this?
                         *
                         * DECLARE cr KEYSET CURSOR FOR
                         SELECT *
                         FROM
                         (
                         SPARQL SELECT * WHERE { ?s ?p ?o } LIMIT 10
                         ) x

                         * @type {string}
                         */

                        var query =
                            "SELECT ?uri\n" +
                            "WHERE \n" +
                            "{ \n" +
                                "{\n" +
                                    "SELECT ?uri \n" +
                                    "FROM [0] \n" +
                                    "WHERE \n" +
                                    "{ \n" +
                                    " ?uri rdf:type ddr:Interaction \n" +
                                    "} \n" +
                                    " ORDER BY ?uri \n" +
                                "}\n" +
                            "} \n" +
                            " OFFSET [1] \n" +
                            " LIMIT [2] \n";

                        db.connection.execute(query,
                            [
                                {
                                    type: DbConnection.resourceNoEscape,
                                    value: graphUri
                                },
                                {
                                    type: DbConnection.int,
                                    value: pageOffset
                                },
                                {
                                    type: DbConnection.int,
                                    value: Config.streaming.db.page_size
                                }
                            ],
                            function (err, interactions)
                            {
                                if (!err && interactions instanceof Array)
                                {
                                    getFullInteractions(interactions, function(err, interactions){
                                        callback(err, interactions, cb);
                                    });
                                }
                                else
                                {
                                    //interactions var will contain an error message instead of an array of results.
                                    callback(err, interactions);
                                }
                            });
                    },
                    function (err, results)
                    {
                        if(err)
                        {
                            callback(err, "Error occurred fetching interactions in streamed mode : " + results);
                        }
                    });
                }
                else
                {
                    callback(1, "Unable to fetch interaction count. Reported Error : " + result);
                }
            });
    }
};

Interaction.getRandomType = function(restrictions)
{
    var filteredTypes = {};
    if(restrictions instanceof Object)
    {
        for(var restriction in restrictions)
        {
            if(restrictions.hasOwnProperty(restriction))
            {
                for (var key in Interaction.types)
                {
                    if (Interaction.types.hasOwnProperty(key))
                    {
                        var type = Interaction.types[key];
                        if (type[restriction] != null && type[restriction] == true && restrictions[restriction])
                        {
                            filteredTypes[key] = Interaction.types[key];
                        }
                    }
                }
            }
        }
    }
    else
    {
        filteredTypes = Interaction.types;
    }

    var propertyIndex = Math.round((Object.keys(filteredTypes).length - 1) * Math.random());

    var interactionType = filteredTypes[Object.keys(filteredTypes)[propertyIndex]];

    return interactionType;
};

Interaction.prototype.saveToMySQL = function(callback, overwrite)
{
    var self = this;

    var targetTable = Config.recommendation.getTargetTable();

    var insertNewInteraction = function(callback)
    {
        var insertNewInteractionQuery = "INSERT INTO ?? " +
            "(" +
            "   uri," +
            "   created," +
            "   modified," +
            "   performedBy," +
            "   interactionType," +
            "   executedOver," +
            "   originallyRecommendedFor," +
            "   rankingPosition," +
            "   pageNumber," +
            "   recommendationCallId," +
            "   recommendationCallTimeStamp" +
            ")" +
            "VALUES " +
            "(" +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?," +
            "   ?" +
            ");";

        var inserts =
            [
                targetTable,
                self.uri,
                moment(self.dcterms.created, moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                moment(self.dcterms.created, moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"),
                self.ddr.performedBy,
                self.ddr.interactionType,
                self.ddr.executedOver,
                self.ddr.originallyRecommendedFor,
                self.ddr.rankingPosition,
                self.ddr.pageNumber,
                self.ddr.recommendationCallId
            ];

        if(self.ddr.recommendationCallTimeStamp != null && self.ddr.recommendationCallTimeStamp.slice(0, 19) != null)
        {
            inserts.push(moment(self.ddr.recommendationCallTimeStamp, moment.ISO_8601).format("YYYY-MM-DD HH:mm:ss"));
        }

        console.log(insertNewInteractionQuery);

        mysql(insertNewInteractionQuery).query(
            insertNewInteractionQuery,
            inserts,
            function(err, rows, fields)
            {
                if(!err)
                {
                    callback(null, rows, fields);
                }
                else
                {
                    var msg = "Error saving interaction to MySQL database : " + err;
                    console.error(msg);
                    callback(1, msg);
                }

            });
    };

    if(overwrite)
    {
        insertNewInteraction(function(err, rows, fields){
            callback(err);
        });
    }
    else
    {
        mysql().query('SELECT * from ?? WHERE uri = ?', [targetTable, self.uri], function(err, rows, fields) {
            if(!err)
            {
                if(rows != null && rows instanceof Array && rows.length > 0)
                {
                    //an interaction with the same URI is already recorded, there must be some error!
                    callback(1, "Interaction with URI " + self.uri + " already recorded in MYSQL.");
                }
                else
                {
                    //insert the new interaction
                    insertNewInteraction(function(err, rows, fields){
                        if(err)
                        {
                            callback(1, "Error inserting new interaction to MYSQL with URI " + self.uri);
                        }
                        else
                        {
                            callback(null, rows);
                        }
                    });
                }
            }
            else
            {
                callback(1, "Error seeing if interaction with URI " + self.uri + " already existed in the MySQL database.");
            }
        });
    }
};

Interaction.types =
{
    accept_descriptor_from_quick_list : {
        key : "accept_descriptor_from_quick_list",
        positive : true
    },
    accept_descriptor_from_manual_list : {
        key : "accept_descriptor_from_manual_list",
        positive : true
    },
    accept_descriptor_from_manual_list_while_it_was_a_project_favorite : {
        key : "accept_descriptor_from_manual_list_while_it_was_a_project_favorite",
        positive : true
    },
    accept_descriptor_from_manual_list_while_it_was_a_user_favorite : {
        key : "accept_descriptor_from_manual_list_while_it_was_a_user_favorite",
        positive : true
    },
    accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite : {
        key : "accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite",
        positive : true
    },
    accept_smart_descriptor_in_metadata_editor : {
        key : "accept_smart_descriptor_in_metadata_editor",
        positive : true
    },
    accept_favorite_descriptor_in_metadata_editor : {
        key : "accept_favorite_descriptor_in_metadata_editor",
        positive : true
    },
    accept_descriptor_from_autocomplete : {
        key : "accept_descriptor_from_autocomplete",
        positive : true
    },

    hide_descriptor_from_quick_list_for_project : {
        key : "hide_descriptor_from_quick_list_for_project",
        negative : true
    },

    unhide_descriptor_from_quick_list_for_project : {
        key : "unhide_descriptor_from_quick_list_for_project",
        negative : true
    },

    hide_descriptor_from_quick_list_for_user : {
        key : "hide_descriptor_from_quick_list_for_user",
        negative : true
    },

    unhide_descriptor_from_quick_list_for_user : {
        key : "unhide_descriptor_from_quick_list_for_user",
        negative : true
    },

    reject_descriptor_from_metadata_editor : {
        key : "reject_descriptor_from_metadata_editor",
        negative : true
    },

    favorite_descriptor_from_quick_list_for_user: {
        key : "favorite_descriptor_from_quick_list_for_user",
        positive : true
    },

    unfavorite_descriptor_from_quick_list_for_user: {
        key : "unfavorite_descriptor_from_quick_list_for_user",
        positive : true
    },

    favorite_descriptor_from_quick_list_for_project: {
        key : "favorite_descriptor_from_quick_list_for_project",
        positive : true
    },

    unfavorite_descriptor_from_quick_list_for_project: {
        key : "unfavorite_descriptor_from_quick_list_for_project",
        positive : true
    },

    reject_ontology_from_quick_list : {
        key : "reject_ontology_from_quick_list",
        negative: true
    },

    browse_to_next_page_in_descriptor_list : {
        key : "browse_to_next_page_in_descriptor_list"
    },

    browse_to_previous_page_in_descriptor_list : {
        key : "browse_to_previous_page_in_descriptor_list"
    },

    //manual mode

    select_ontology_manually : {
        key : "select_ontology_manually",
        positive : true
    },

    delete_descriptor_in_metadata_editor : {
        key : "delete_descriptor_in_metadata_editor",
        positive : true
    },

    fill_in_descriptor_from_manual_list_in_metadata_editor : {
        key : "fill_in_descriptor_from_manual_list_in_metadata_editor",
        positive : true
    },

    fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite : {
        key : "fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite",
        positive : true
    },

    fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite : {
        key : "fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite",
        positive : true
    },

    fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite : {
        key : "fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite",
        positive : true
    },

    fill_in_descriptor_from_quick_list_in_metadata_editor : {
        key : "fill_in_descriptor_from_quick_list_in_metadata_editor",
        positive : true
    },

    fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite : {
        key : "fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite",
        positive : true
    },

    fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite : {
        key : "fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite",
        positive : true
    },

    fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite : {
        key : "fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite",
        positive : true
    },


    fill_in_inherited_descriptor : {
        key : "fill_in_inherited_descriptor",
        label : "Fill in inherited descriptor"
    }
};

Interaction.prefixedRDFType = "ddr:Interaction";

Interaction = Class.extend(Interaction, Resource);

module.exports.Interaction = Interaction;