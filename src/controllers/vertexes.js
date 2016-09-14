var Config = require('../models/meta/config.js').Config;

var DbConnection = require(Config.absPathInProject("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();

var async = require('async');

/*
 * GET home page.
 */

/*shows all vertexes with abstract*/

exports.all = function(req, res)
{
    var Resource = require('./resource.js').Resource;

    var viewVars = {
        title : 'All vertexes',
        currentPage : 0,
        pageSize : 0
    };

    Resource.all(req, function(err, results)
    {
        if(!err)
        {
            viewVars.vertexes = results;
            res.render('vertexes/all',
                viewVars
            )
        }
        else
        {
            viewVars.vertexes = [];
            viewVars.error_messages = "Unable to fetch nodes"
            res.render('vertexes/all',
                viewVars
            )
        }
    });
};

exports.with_property = function(req, res) {

    var viewVars = {
        title : 'All vertexes from DBpedia that have an abstract'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    var query = DbConnection.paginateQuery(
        req,
        "SELECT DISTINCT ?s WHERE {?s [0] ?o .}"
    );
	
	switch(req.params["source"])
	{
		case ("dbpedia"):
		{
			db.connection.execute(query,
                    [
                        {
                            type: DbConnection.resource,
                            value : "http://dbpedia.org/ontology/"+req.params["property"]
                        }
                    ],
					function(err, results) {
                        if(!err)
                        {
                            viewVars.vertexes = results;
                            res.render('vertexes/all', viewVars);
                        }
                        else
                        {
                            viewVars.error_messages = ["Unable to fetch dbpedia nodes"];
                            viewVars.vertexes = results;
                            res.render('vertexes/all', viewVars);
                        }
					});
			break;
		}
		default:
		{
			res.render('vertexes/all', {
				title : 'There was an error...',
				vertexes : []
			});
			
			break;
		}
	}
};

exports.show = function(req, res) {
	
	db.connection.execute("SELECT ?p ?o WHERE {[0] ?p ?o .}",
            [
                {
                    type : DbConnection.resource,
                    value : req.query.vertex_uri
                }
            ],
			function(err, results) {

                if(!err)
                {
                    res.render('vertexes/show', {
                        title : 'Showing a single vertex',
                        neighbours : results,
                        vertex : req.query.vertex_uri
                    });
                }
                else
                {
                    res.render('vertexes/show', {
                        title : 'Error',
                        neighbours : [],
                        vertex : null,
                        error_messages: ["Error retrieving vertex from the database"]
                    });
                }
			});
};

exports.random = function(req, res) {

	req.async.waterfall([
			function(callback) {
				db.connection.execute("SELECT (count(?s) as ?c) WHERE {?s ?p ?o .}",
                        [],
						function(err, results) {
                            if(!err)
                            {
                                var randomNumber = Math.floor(Math.random() * results[0].c + 1);
                                callback(null, randomNumber);
                            }
                            else
                            {
                                res.render('index', {
                                    error_messages : [
                                        "Error connecting to the Virtuoso database"
                                    ]
                                });
                            }
						});
			},
			function(randomNumber,callback) {
				db.connection.execute(
						"SELECT ?s WHERE { ?s ?p ?o } ORDER BY ?s OFFSET [0] LIMIT 1",
                        [
                            {
                                type: DbConnection.int,
                                value: randomNumber
                            }
                        ],
                        function(err, results) {
                            if(!err)
                            {
                                callback(null, results[0].s, randomNumber);
                            }
                            else
                            {
                                res.render('vertexes/show', {
                                    title : "Viewing a random vertex in the knowledge base",
                                    vertexIndex : 0,
                                    vertex : null,
                                    neighbours : null,
                                    error_messages: ["Unable to fetch random vertex"]
                                });

                                callback(true);
                            }

						});
			},
			function(selectedVertex, randomNumber, callback) {
				getOutNeighbours(req, selectedVertex, function(neighbours)
				{
					callback(null, selectedVertex, randomNumber, neighbours);
				});
			},
			function(selectedVertex, randomNumber, neighbours, callback) {
				
				req.util.debug("Results :\n"
						+ req.util.inspect(neighbours, true, null));

				res.format({
						json: function()
						{
							res.send({ vertexIndex: randomNumber, vertexUri : selectedVertex, neighbours: neighbours});
						},
						html: function()
						{
							res.render('vertexes/show', {
								title : "Viewing a random vertex in the knowledge base",
								vertexIndex : randomNumber, 
								vertex : selectedVertex,
								neighbours : neighbours
							});
						}
					});
			}
			]);
};



//var document = {
//    last_indexing_date : now.toISOString(),
//    graph : graphURI,
//    property : results[i].prop,
//    value : decodeURI(results[i].literal)
//};

exports.search = function(req, res)
{
	var query = req.query.q;

    if(query)
    {

        if(!req.query.currentPage)
        {
            req.query.currentPage = 0;
        }
        if(!req.query.pageSize)
        {
            req.query.pageSize = 20;
        }

        var skip = req.query.pageSize * req.query.currentPage;

        Resource.findResourcesByTextQuery(
            req.index,
            query,
            skip,
            req.query.pageSize,
            function(err, results)
            {
                var getSimilarResources = function(resource, callback)
                {
                    resource.getTextuallySimilarResources(req.index, Config.limits.index.maxResults, function(err, similarResources)
                    {
                        resource.recommendations = similarResources;
                        callback(err, resource); //null as 1st argument == no error
                    });
                };

                async.map(results, getSimilarResources, function(err, resultsWithSimilarOnes)
                {
                    var renderParameters = {
                        title : 'Search Results'
                    };

                    if(results != null && results.length > 0)
                    {
                        renderParameters.vertexes = resultsWithSimilarOnes;
                        renderParameters.currentPage = req.query.currentPage;
                        renderParameters.pageSize = req.query.pageSize;
                    }
                    else
                    {
                        renderParameters.vertexes = [];
                        renderParameters.info_messages = ["No results found for query: \"" + query + "\"."];
                    }

                    res.render('vertexes/search', renderParameters);
                });
            });
    }
    else
    {
        res.render('vertexes/all', {
            title : 'No query specified',
            vertexes : []
        });
    }
};

//vertex access methods

//get all nodes that are objects of properties leaving the random node
getOutNeighbours = function(req, vertexUri, callback)
{
	db.connection.execute(
			"SELECT ?p ?o WHERE { [0] ?p ?o } LIMIT 100",
            [
                {
                    type : DbConnection.resource,
                    value : vertexUri
                }
            ],
            function(err, results) {
                if(!err)
                {
                    callback(results);
                }
                else
                {
                    callback([]);
                }
			});
};

