const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const db = Config.getDBByID();

const async = require("async");

/*
 * GET home page.
 */

/*shows all vertexes with abstract*/

exports.all = function(req, res)
{
    const Resource = require('./resource.js').Resource;

    const viewVars = {
        title: 'All vertexes',
        currentPage: 0,
        pageSize: 0
    };

    Resource.all(req, function(err, results)
    {
        if(isNull(err))
        {
            viewVars.vertexes = results;
            res.render('vertexes/all',
                viewVars
            )
        }
        else
        {
            viewVars.vertexes = [];
            viewVars.error_messages = "Unable to fetch nodes";
            res.render('vertexes/all',
                viewVars
            )
        }
    });
};

exports.show = function(req, res) {
	
	db.connection.execute("SELECT ?p ?o WHERE {[0] ?p ?o .}",
            [
                {
                    type : Elements.types.resource,
                    value : req.query.vertex_uri
                }
            ],
			function(err, results) {

                if(isNull(err))
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
                            if(isNull(err))
                            {
                                const randomNumber = Math.floor(Math.random() * results[0].c + 1);
                                return callback(null, randomNumber);
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
                                type: Elements.types.int,
                                value: randomNumber
                            }
                        ],
                        function(err, results) {
                            if(isNull(err))
                            {
                                return callback(null, results[0].s, randomNumber);
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

                                return callback(true);
                            }

						});
			},
			function(selectedVertex, randomNumber, callback) {
				getOutNeighbours(req, selectedVertex, function(neighbours)
				{
					return callback(null, selectedVertex, randomNumber, neighbours);
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
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
	const query = req.query.q;

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

        const skip = req.query.pageSize * req.query.currentPage;

        Resource.findResourcesByTextQuery(
            req.index,
            query,
            skip,
            req.query.pageSize,
            function(err, results)
            {
                let getSimilarResources = function(resource, callback)
                {
                    resource.getTextuallySimilarResources(req.index, Config.limits.index.maxResults, function(err, similarResources)
                    {
                        resource.recommendations = similarResources;
                        return callback(err, resource); //null as 1st argument === no error
                    });
                };

                async.map(results, getSimilarResources, function(err, resultsWithSimilarOnes)
                {
                    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                    {
                        res.json({
                            "result" : "ok",
                            "hits" : results
                        });
                    }
                    else
                    {
                        let renderParameters = {
                            title : 'Search Results'
                        };

                        if(!isNull(results) && results.length > 0)
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
                    }
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
                    type : Elements.types.resource,
                    value : vertexUri
                }
            ],
            function(err, results) {
                if(isNull(err))
                {
                    return callback(results);
                }
                else
                {
                    return callback([]);
                }
			});
};

