const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const db = Config.getDBByID();

const async = require("async");

// var document = {
//    last_indexing_date : now.toISOString(),
//    graph : graphURI,
//    property : results[i].prop,
//    value : decodeURI(results[i].literal)
// };

exports.search = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    const query = req.query.q;

    if (query)
    {
        if (!req.query.currentPage)
        {
            req.query.currentPage = 0;
        }
        if (!req.query.pageSize)
        {
            req.query.pageSize = 20;
        }

        const skip = req.query.pageSize * req.query.currentPage;

        Resource.findResourcesByTextQuery(
            req.index,
            query,
            skip,
            req.query.pageSize,
            function (err, results)
            {
                let getSimilarResources = function (resource, callback)
                {
                    resource.getTextuallySimilarResources(req.index, Config.limits.index.maxResults, function (err, similarResources)
                    {
                        resource.recommendations = similarResources;
                        return callback(err, resource); // null as 1st argument === no error
                    });
                };

                async.mapSeries(results, getSimilarResources, function (err, resultsWithSimilarOnes)
                {
                    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
                    {
                        res.json({
                            result: "ok",
                            hits: results
                        });
                    }
                    else
                    {
                        let renderParameters = {
                            title: "Search Results"
                        };

                        if (!isNull(results) && results.length > 0)
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
                        res.render("vertexes/search", renderParameters);
                    }
                });
            });
    }
    else
    {
        res.render("vertexes/all", {
            title: "No query specified",
            vertexes: []
        });
    }
};
