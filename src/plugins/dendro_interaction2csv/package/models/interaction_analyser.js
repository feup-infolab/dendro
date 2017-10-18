const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

var Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;

var db = Config.getDBByGraphUri()
var gfs = Config.getGFSByID();

var async = require('async');
var _ = require('underscore');

function InteractionAnalyser (object)
{
    return self;
}

InteractionAnalyser.getFullInteractions = function(interactions, callback)
{
    var getInteractionInformation = function(interaction, callback)
    {
        Interaction.findByUri(interaction.uri, callback, null, customGraphUri);
    };

    // get all the information about all the interaction
    // and return the array of interactions, complete with that info
    async.map(interactions, getInteractionInformation, function(err, interactionsToReturn)
    {
        if(isNull(err))
        {
            callback(null, interactionsToReturn);
        }
        else
        {
            callback(err, "error fetching interaction information : " + err  + "error reported: " + interactionsToReturn);
        }
    });
};

InteractionAnalyser.average_descriptor_size_per_interaction = function(callback, streaming, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string")? customGraphUri : db.graphUri;

    const query =
        "SELECT COUNT (?uri) as ?n_interactions " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Interaction " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            }
        ],

        function (err, result)
        {
            if (isNull(err) && result instanceof Array && result.length == 1)
            {
                const count = result[0].n_interactions;
                const n_pages = Math.ceil(count / Config.streaming.db.page_size);
                const pageNumbersArray = [];

                for (let i = 0; i <= n_pages; i++)
                {
                    pageNumbersArray.push(i);
                }

                async.mapLimit(pageNumbersArray, Config.recommendation.max_interaction_pushing_threads, function (pageNumber, cb)
                    {
                        console.log("Sending page " + pageNumber + " of " + n_pages);

                        const pageOffset = pageNumber * Config.streaming.db.page_size;

                        const query =
                            "SELECT ?uri ?date_created ?interaction_type\n" +
                            "WHERE \n" +
                            "{ \n" +
                            "   {\n" +
                            "   SELECT ?uri ?date_created ?interaction_type\n" +
                            "   FROM [0] \n" +
                            "   WHERE \n" +
                            "   { \n" +
                            "       ?uri rdf:type ddr:Interaction. \n" +
                            "       ?uri ddr:created ?date_created. \n " +
                            "       ?uri ddr:interactionType ?interaction_type \n " +
                            "   } \n" +
                            "   ORDER BY ?uri \n" +
                            "   }\n" +
                            "} \n" +
                            " OFFSET [1] \n" +
                            " LIMIT [2] \n";

                        db.connection.execute(query,
                            [
                                {
                                    type: Elements.types.resourceNoEscape,
                                    value: graphUri
                                },
                                {
                                    type: Elements.types.int,
                                    value: pageOffset
                                },
                                {
                                    type: Elements.types.int,
                                    value: Config.streaming.db.page_size
                                }
                            ],
                            function (err, interactions)
                            {
                                if (isNull(err) && interactions instanceof Array)
                                {
                                    async.mapLimit(interactions, 1, function(interaction,callback){
                                        var query =
                                            "SELECT [3] as ?interaction_uri [4] as ?interaction_type [2] as ?interaction_date ?descriptor AVG(?descriptor_length) as ?avg_descriptor_length \n" +
                                            "{   \n" +
                                            "   SELECT ?latest_version ?descriptor ?date_last_version_created ?descriptor_length \n" +
                                            "   { \n" +
                                            "       SELECT ?latest_version ?descriptor ?date_last_version_created STRLEN(STR(?value)) as ?descriptor_length \n" +
                                            "       FROM [0] \n" +
                                            "          WHERE \n" +
                                            "          { \n" +
                                            "              { \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:FileDataObject. \n" +
                                            "                  } \n" +
                                            "                  UNION \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:Folder. \n" +
                                            "                  } \n" +
                                            "              }. \n" +
                                            "              { \n" +
                                            "                  ?latest_version ddr:isVersionOf ?resource. \n" +
                                            "                  { \n" +
                                            "                      SELECT ?resource MAX(?version_number) as ?latest_version_number \n" +
                                            "                      FROM [0] \n" +
                                            "                      WHERE \n" +
                                            "                      { \n" +
                                            "                          ?version ddr:isVersionOf ?resource. \n" +
                                            "                          ?version ddr:versionNumber ?version_number. \n" +
                                            "                      } \n" +
                                            "              }. \n" +
                                            "" +
                                            "              ?latest_version ddr:versionNumber ?latest_version_number. \n" +
                                            "              ?latest_version ddr:created ?date_last_version_created. \n" +
                                            "              ?latest_version ?descriptor ?value. \n" +
                                            "" +
                                            "              FILTER \n" +
                                            "              ( \n" +
                                            "                  STRSTARTS(STR(?descriptor), [1]) \n" +
                                            "                  && \n" +
                                            "                  xsd:dateTime(?date_last_version_created) < xsd:dateTime([2]) \n" +
                                            "              ) \n" +
                                            "           }\n" +
                                            "       }\n" +
                                            "       ORDER BY DESC (?date_last_version_created)\n" +
                                            "   }\n" +
                                            "}\n";

                                        db.connection.execute(query,
                                            [
                                                {
                                                    type: Elements.types.resourceNoEscape,
                                                    value: graphUri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: "http://purl.org/dc/terms/"
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.date_created
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.uri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.interaction_type
                                                },
                                            ],
                                            function (err, results)
                                            {
                                                if (isNull(err) && results instanceof Array)
                                                {
                                                    const transposedResult = {};
                                                    for(let i = 0; i < results.length; i++)
                                                    {
                                                        let descriptor = results[i].descriptor;
                                                        transposedResult[descriptor] = results[i].avg_descriptor_length;
                                                        if(transposedResult['interaction_uri'] == null)
                                                        {
                                                            transposedResult['interaction_uri'] = results[i].interaction_uri;
                                                        }
                                                        else if(transposedResult['interaction_date'] == null)
                                                        {
                                                            transposedResult['interaction_date'] = results[i].interaction_date;
                                                        }
                                                    }

                                                    callback(null, transposedResult);
                                                }
                                                else
                                                {
                                                    //interactions var will contain an error message instead of an array of results.
                                                    callback(err, results);
                                                }
                                            });
                                    },function(err, results){
                                        if(err)
                                        {
                                            console.log("Error fetching average size of metadata records. " + results);
                                        }
                                        callback(err, results, cb);
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
};


InteractionAnalyser.number_of_descriptors_of_each_type_per_interaction = function(callback, streaming, customGraphUri)
{
    let graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string")? customGraphUri : db.graphUri;

    const query =
        "SELECT COUNT (?uri) as ?n_interactions " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Interaction " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            }
        ],

        function (err, result)
        {
            if (isNull(err) && result instanceof Array && result.length === 1)
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

                        var query =
                            "SELECT ?uri ?date_created ?interaction_type\n" +
                            "WHERE \n" +
                            "{ \n" +
                            "   {\n" +
                            "   SELECT ?uri ?date_created ?interaction_type\n" +
                            "   FROM [0] \n" +
                            "   WHERE \n" +
                            "   { \n" +
                            "       ?uri rdf:type ddr:Interaction. \n" +
                            "       ?uri ddr:created ?date_created. \n " +
                            "       ?uri ddr:interactionType ?interaction_type \n " +
                            "   } \n" +
                            "   ORDER BY ?uri \n" +
                            "   }\n" +
                            "} \n" +
                            " OFFSET [1] \n" +
                            " LIMIT [2] \n";

                        db.connection.execute(query,
                            [
                                {
                                    type: Elements.types.resourceNoEscape,
                                    value: graphUri
                                },
                                {
                                    type: Elements.types.int,
                                    value: pageOffset
                                },
                                {
                                    type: Elements.types.int,
                                    value: Config.streaming.db.page_size
                                }
                            ],
                            function (err, interactions)
                            {
                                if (isNull(err) && interactions instanceof Array)
                                {
                                    async.mapLimit(interactions, 1, function(interaction,callback){
                                        var query =
                                            "SELECT [2] as ?interaction_date [3] as ?interaction_uri [4] as ?interaction_type ?descriptor SUM(?num_values) as ?total_instances \n" +
                                            "{   \n" +
                                            "   SELECT ?latest_version ?date_last_version_created ?descriptor COUNT(?value) as ?num_values \n" +
                                            "   { \n" +
                                            "       SELECT ?latest_version ?date_last_version_created ?descriptor ?value\n" +
                                            "       FROM [0] \n" +
                                            "          WHERE \n" +
                                            "          { \n" +
                                            "              { \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:FileDataObject. \n" +
                                            "                  } \n" +
                                            "                  UNION \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:Folder. \n" +
                                            "                  } \n" +
                                            "              }. \n" +
                                            "              { \n" +
                                            "                  ?latest_version ddr:isVersionOf ?resource. \n" +
                                            "                  { \n" +
                                            "                      SELECT ?resource MAX(?version_number) as ?latest_version_number \n" +
                                            "                      FROM [0] \n" +
                                            "                      WHERE \n" +
                                            "                      { \n" +
                                            "                          ?version ddr:isVersionOf ?resource. \n" +
                                            "                          ?version ddr:versionNumber ?version_number. \n" +
                                            "                      } \n" +
                                            "              }. \n" +
                                            "" +
                                            "              ?latest_version ddr:versionNumber ?latest_version_number. \n" +
                                            "              ?latest_version ddr:created ?date_last_version_created. \n" +
                                            "              ?latest_version ?descriptor ?value. \n" +
                                            "" +
                                            "              FILTER \n" +
                                            "              ( \n" +
                                            "                  STRSTARTS(STR(?descriptor), [1]) \n" +
                                            "                  && \n" +
                                            "                  xsd:dateTime(?date_last_version_created) < xsd:dateTime([2]) \n" +
                                            "              ) \n" +
                                            "           }\n" +
                                            "       }\n" +
                                            "       ORDER BY DESC (?date_last_version_created)\n" +
                                            "   }\n" +
                                            "}\n";

                                        db.connection.execute(query,
                                            [
                                                {
                                                    type: Elements.types.resourceNoEscape,
                                                    value: graphUri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: "http://purl.org/dc/terms/"
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.date_created
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.uri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.interaction_type
                                                }
                                            ],
                                            function (err, results)
                                            {
                                                if (isNull(err) && results instanceof Array && results.length == 1)
                                                {
                                                    callback(null, results[0]);
                                                }
                                                else
                                                {
                                                    //interactions var will contain an error message instead of an array of results.
                                                    callback(err, results);
                                                }
                                            });
                                    },function(err, results){
                                        if(err)
                                        {
                                            console.log("Error fetching average size of metadata records. " + results);
                                        }
                                        callback(err, results, cb);
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
};

InteractionAnalyser.total_number_of_descriptors_per_interaction = function(callback, streaming, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string")? customGraphUri : db.graphUri;

    const query =
        "SELECT COUNT (?uri) as ?n_interactions " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Interaction " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            }
        ],

        function (err, result)
        {
            if (isNull(err) && result instanceof Array && result.length == 1)
            {
                const count = result[0].n_interactions;
                const n_pages = Math.ceil(count / Config.streaming.db.page_size);
                const pageNumbersArray = [];

                for (let i = 0; i <= n_pages; i++)
                {
                    pageNumbersArray.push(i);
                }

                async.mapLimit(pageNumbersArray, Config.recommendation.max_interaction_pushing_threads, function (pageNumber, cb)
                    {
                        console.log("Sending page " + pageNumber + " of " + n_pages);

                        var pageOffset = pageNumber * Config.streaming.db.page_size;

                        var query =
                            "SELECT ?uri ?date_created ?interaction_type\n" +
                            "WHERE \n" +
                            "{ \n" +
                            "   {\n" +
                            "   SELECT ?uri ?date_created ?interaction_type\n" +
                            "   FROM [0] \n" +
                            "   WHERE \n" +
                            "   { \n" +
                            "       ?uri rdf:type ddr:Interaction. \n" +
                            "       ?uri ddr:created ?date_created. \n " +
                            "       ?uri ddr:interactionType ?interaction_type \n " +
                            "   } \n" +
                            "   ORDER BY ?uri \n" +
                            "   }\n" +
                            "} \n" +
                            " OFFSET [1] \n" +
                            " LIMIT [2] \n";

                        db.connection.execute(query,
                            [
                                {
                                    type: Elements.types.resourceNoEscape,
                                    value: graphUri
                                },
                                {
                                    type: Elements.types.int,
                                    value: pageOffset
                                },
                                {
                                    type: Elements.types.int,
                                    value: Config.streaming.db.page_size
                                }
                            ],
                            function (err, interactions)
                            {
                                if (isNull(err) && interactions instanceof Array)
                                {
                                    async.mapLimit(interactions, 1, function(interaction,callback){
                                        var query =
                                            "SELECT [2] as ?date_created [3] as ?interaction_uri [4] as ?interaction_type SUM(?num_descriptors) as ?total_num_descriptors \n" +
                                            "{   \n" +
                                            "   SELECT ?latest_version ?date_last_version_created COUNT(?descriptor) as ?num_descriptors \n" +
                                            "   { \n" +
                                            "       SELECT ?latest_version ?descriptor ?date_last_version_created \n" +
                                            "       FROM [0] \n" +
                                            "          WHERE \n" +
                                            "          { \n" +
                                            "              { \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:FileDataObject. \n" +
                                            "                  } \n" +
                                            "                  UNION \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:Folder. \n" +
                                            "                  } \n" +
                                            "              }. \n" +
                                            "              { \n" +
                                            "                  ?latest_version ddr:isVersionOf ?resource. \n" +
                                            "                  { \n" +
                                            "                      SELECT ?resource MAX(?version_number) as ?latest_version_number \n" +
                                            "                      FROM [0] \n" +
                                            "                      WHERE \n" +
                                            "                      { \n" +
                                            "                          ?version ddr:isVersionOf ?resource. \n" +
                                            "                          ?version ddr:versionNumber ?version_number. \n" +
                                            "                      } \n" +
                                            "              }. \n" +
                                            "" +
                                            "              ?latest_version ddr:versionNumber ?latest_version_number. \n" +
                                            "              ?latest_version ddr:created ?date_last_version_created. \n" +
                                            "              ?latest_version ?descriptor ?value. \n" +
                                            "" +
                                            "              FILTER \n" +
                                            "              ( \n" +
                                            "                  STRSTARTS(STR(?descriptor), [1]) \n" +
                                            "                  && \n" +
                                            "                  xsd:dateTime(?date_last_version_created) < xsd:dateTime([2]) \n" +
                                            "              ) \n" +
                                            "           }\n" +
                                            "       }\n" +
                                            "       ORDER BY DESC (?date_last_version_created)\n" +
                                            "   }\n" +
                                            "}\n";

                                        db.connection.execute(query,
                                            [
                                                {
                                                    type: Elements.types.resourceNoEscape,
                                                    value: graphUri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: "http://purl.org/dc/terms/"
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.date_created
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.uri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.interaction_type
                                                }
                                            ],
                                            function (err, results)
                                            {
                                                if (isNull(err) && results instanceof Array && results.length == 1)
                                                {
                                                    callback(null, results[0]);
                                                }
                                                else
                                                {
                                                    //interactions var will contain an error message instead of an array of results.
                                                    callback(err, results);
                                                }
                                            });
                                    },function(err, results){
                                        if(err)
                                        {
                                            console.log("Error fetching average size of metadata records. " + results);
                                        }
                                        callback(err, results, cb);
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
};

InteractionAnalyser.average_metadata_sheet_size_per_interaction = function(callback, streaming, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string")? customGraphUri : db.graphUri;

    const query =
        "SELECT COUNT (?uri) as ?n_interactions " +
        "FROM [0] " +
        "WHERE " +
        "{ " +
        " ?uri rdf:type ddr:Interaction " +
        "} ";

    db.connection.execute(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            }
        ],

        function (err, result)
        {
            if (isNull(err) && result instanceof Array && result.length === 1)
            {
                const count = result[0].n_interactions;
                const n_pages = Math.ceil(count / Config.streaming.db.page_size);
                const pageNumbersArray = [];

                for (let i = 0; i <= n_pages; i++)
                {
                    pageNumbersArray.push(i);
                }

                async.mapLimit(pageNumbersArray, Config.recommendation.max_interaction_pushing_threads, function (pageNumber, cb)
                    {
                        console.log("Sending page " + pageNumber + " of " + n_pages);

                        var pageOffset = pageNumber * Config.streaming.db.page_size;

                        var query =
                            "SELECT ?uri ?date_created ?interaction_type\n" +
                            "WHERE \n" +
                            "{ \n" +
                            "   {\n" +
                            "   SELECT ?uri ?date_created ?interaction_type\n" +
                            "   FROM [0] \n" +
                            "   WHERE \n" +
                            "   { \n" +
                            "       ?uri rdf:type ddr:Interaction. \n" +
                            "       ?uri ddr:created ?date_created. \n " +
                            "       ?uri ddr:interactionType ?interaction_type \n " +
                            "   } \n" +
                            "   ORDER BY ?uri \n" +
                            "   }\n" +
                            "} \n" +
                            " OFFSET [1] \n" +
                            " LIMIT [2] \n";

                        db.connection.execute(query,
                            [
                                {
                                    type: Elements.types.resourceNoEscape,
                                    value: graphUri
                                },
                                {
                                    type: Elements.types.int,
                                    value: pageOffset
                                },
                                {
                                    type: Elements.types.int,
                                    value: Config.streaming.db.page_size
                                }
                            ],
                            function (err, interactions)
                            {
                                if (isNull(err) && interactions instanceof Array)
                                {
                                    async.mapLimit(interactions, 1, function(interaction,callback){
                                        var query =
                                            "SELECT [3] as ?interaction_uri [4] as ?interaction_type AVG(?num_descriptors) as ?avg_num_descriptors \n" +
                                            "{   \n" +
                                            "   SELECT ?latest_version ?date_last_version_created COUNT(?descriptor) as ?num_descriptors \n" +
                                            "   { \n" +
                                            "       SELECT ?latest_version ?descriptor ?date_last_version_created \n" +
                                            "       FROM [0] \n" +
                                            "          WHERE \n" +
                                            "          { \n" +
                                            "              { \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:FileDataObject. \n" +
                                            "                  } \n" +
                                            "                  UNION \n" +
                                            "                  { \n" +
                                            "                      ?resource rdf:type nfo:Folder. \n" +
                                            "                  } \n" +
                                            "              }. \n" +
                                            "              { \n" +
                                            "                  ?latest_version ddr:isVersionOf ?resource. \n" +
                                            "                  { \n" +
                                            "                      SELECT ?resource MAX(?version_number) as ?latest_version_number \n" +
                                            "                      FROM [0] \n" +
                                            "                      WHERE \n" +
                                            "                      { \n" +
                                            "                          ?version ddr:isVersionOf ?resource. \n" +
                                            "                          ?version ddr:versionNumber ?version_number. \n" +
                                            "                      } \n" +
                                            "              }. \n" +
                                            "" +
                                            "              ?latest_version ddr:versionNumber ?latest_version_number. \n" +
                                            "              ?latest_version ddr:created ?date_last_version_created. \n" +
                                            "              ?latest_version ?descriptor ?value. \n" +
                                            "" +
                                            "              FILTER \n" +
                                            "              ( \n" +
                                            "                  STRSTARTS(STR(?descriptor), [1]) \n" +
                                            "                  && \n" +
                                            "                  xsd:dateTime(?date_last_version_created) < xsd:dateTime([2]) \n" +
                                            "              ) \n" +
                                            "           }\n" +
                                            "       }\n" +
                                            "       ORDER BY DESC (?date_last_version_created)\n" +
                                            "   }\n" +
                                            "}\n";

                                        db.connection.execute(query,
                                            [
                                                {
                                                    type: Elements.types.resourceNoEscape,
                                                    value: graphUri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: "http://purl.org/dc/terms/"
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.date_created
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.uri
                                                },
                                                {
                                                    type: Elements.types.stringNoEscape,
                                                    value: interaction.interaction_type
                                                }
                                            ],
                                            function (err, results)
                                            {
                                                if (isNull(err) && results instanceof Array && results.length == 1)
                                                {
                                                    callback(null, results[0]);
                                                }
                                                else
                                                {
                                                    //interactions var will contain an error message instead of an array of results.
                                                    callback(err, results);
                                                }
                                            });
                                    },function(err, results){
                                        if(err)
                                        {
                                            console.log("Error fetching average size of metadata records. " + results);
                                        }
                                        callback(err, results, cb);
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
};

module.exports.InteractionAnalyser = InteractionAnalyser;