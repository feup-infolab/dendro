const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const IndexConnection = require(Pathfinder.absPathInSrcFolder("/kb/index.js")).IndexConnection;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const Administrator = require(Pathfinder.absPathInSrcFolder("/models/administrator.js")).Administrator;

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

    if (!isNull(query) && query !== "")
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
            IndexConnection.getDefault(),
            query,
            skip,
            req.query.pageSize,
            function (err, results)
            {
                let getSimilarResources = function (resource, callback)
                {
                    resource.getTextuallySimilarResources(function (err, similarResources)
                    {
                        if (isNull(resource.indexData))
                        {
                            resource.indexData = {};
                        }

                        resource.indexData.recommendations = similarResources;
                        return callback(err, resource);
                    }, Config.limits.index.maxResults);
                };

                async.mapSeries(results, getSimilarResources, function (err, resultsWithSimilarOnes)
                {
                    // will be null if the client does not accept html
                    if (acceptsJSON && !acceptsHTML)
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
                            renderParameters.results = resultsWithSimilarOnes;

                            renderParameters.metadata = _.map(resultsWithSimilarOnes, function (result)
                            {
                                return result.getDescriptors(
                                    [Elements.access_types.private, Elements.access_types.private],
                                    [Elements.access_types.api_readable]
                                );
                            });

                            renderParameters.types = _.map(resultsWithSimilarOnes, function (result)
                            {
                                if (result.isA(File))
                                {
                                    return "file";
                                }
                                else if (result.isA(Folder))
                                {
                                    return "folder";
                                }
                                else if (result.isA(User))
                                {
                                    return "user";
                                }
                                else if (result.isA(Administrator))
                                {
                                    return "user";
                                }
                                else if (result.isA(Project))
                                {
                                    return "project";
                                }
                            });

                            renderParameters.currentPage = req.query.currentPage;
                            renderParameters.pageSize = req.query.pageSize;
                        }
                        else
                        {
                            renderParameters.results = [];
                            renderParameters.info_messages = ["No results found for query: \"" + query + "\"."];
                        }

                        res.render("search/search", renderParameters);
                    }
                });
            });
    }
    else
    {
        res.render("search/search", {
            title: "No query specified",
            info_messages: ["No query specified"],
            results: []
        });
    }
};
