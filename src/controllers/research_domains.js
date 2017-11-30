const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const ResearchDomain = require(Pathfinder.absPathInSrcFolder("/models/meta/research_domain.js")).ResearchDomain;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const async = require("async");
const _ = require("underscore");

exports.autocomplete = function (req, res)
{
    const query = req.query.query;

    if (!isNull(query))
    {
        ResearchDomain.findByTitleOrDescription(
            query,
            function (err, researchDomains)
            {
                if (isNull(err))
                {
                    _.map(researchDomains, function (researchDomain)
                    {
                        Descriptor.removeUnauthorizedFromObject(researchDomain, [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_accessible]);
                    });

                    res.json(
                        researchDomains
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages: [researchDomains]
                        }
                    );
                }
            },
            Config.recommendation.max_autocomplete_results);
    }
    else
    {
        res.status(400).json(
            {
                error_messages: ["You did not send the autocomplete query. The request should be something like /research_domains/autocomplete?query=blablabla."]
            }
        );
    }
};

exports.all = function (req, res)
{
    ResearchDomain.all(function (err, researchDomains)
    {
        if (isNull(err))
        {
            res.json({
                result: "ok",
                research_domains: researchDomains
            });
        }
        else
        {
            res.status(500).json(
                {
                    error_messages: [researchDomains]
                }
            );
        }
    }, null, [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_accessible]);
};

exports.edit = function (req, res)
{
    const newResearchDomains = req.body;

    if (newResearchDomains instanceof Array)
    {
        async.mapSeries(newResearchDomains,
            function (domain, callback)
            {
                ResearchDomain.create(domain, function (err, rd)
                {
                    rd.save(function (err, result)
                    {
                        if (err)
                        {
                            const msg = "Error saving research domain " + JSON.stringify(domain) + " because of error " + JSON.stringify(result);
                            Logger.log("error", msg);
                        }

                        return callback(err, result);
                    });
                });
            },
            function (err, results)
            {
                if (isNull(err))
                {
                    res.json({
                        result: "ok",
                        message: "All research domains saved successfully"
                    }
                    );
                }
                else
                {
                    res.status(500).json({
                        result: "error",
                        message: "Error updating research domains. Error reported " + JSON.stringify(results)
                    }
                    );
                }
            });
    }
};

exports.delete = function (req, res)
{
    const uriOfResearchDomainToDelete = decodeURI(req.params.uri);

    if (!isNull(uriOfResearchDomainToDelete))
    {
        ResearchDomain.findByUri(uriOfResearchDomainToDelete, function (err, research_domain)
        {
            if (isNull(err))
            {
                if (typeof research_domain !== "undefined")
                {
                    research_domain.deleteAllMyTriples(function (err, result)
                    {
                        if (isNull(err))
                        {
                            res.json({
                                result: "ok",
                                message: "Research Domain " + uriOfResearchDomainToDelete + " deleted successfully."
                            }
                            );
                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "Error deleting research domain. Error reported " + JSON.stringify(results)
                            }
                            );
                        }
                    });
                }
                else
                {
                    res.status(500).json({
                        result: "error",
                        message: "Unable to find research domain with URI " + uriOfResearchDomainToDelete + " . Error reported " + JSON.stringify(results)
                    }
                    );
                }
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Error retrieving research domain. Error reported " + JSON.stringify(results)
                }
                );
            }
        });
    }
    else
    {
        res.status(400).json({
            result: "error",
            message: "Invalid object sent in for deleting. The body of the request must contain the an 'uri' field, stating which research domain to delete"
        }
        );
    }
};
