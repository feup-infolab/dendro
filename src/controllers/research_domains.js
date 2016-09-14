var Config = require('../models/meta/config.js').Config;

var ResearchDomain = require(Config.absPathInProject("/models/meta/research_domain.js")).ResearchDomain;

var async = require('async');
var _ = require('underscore');

exports.autocomplete = function(req, res) {

    var query = req.query.query;

    if(query != null)
    {
        ResearchDomain.findByTitleOrDescription(
            query,
            function(err, research_domains)
            {
                if(!err)
                {
                    for(var i = 0; i < research_domains.length; i++)
                    {
                        if(research_domains[i].id == null)
                        {
                            research_domains[i].id = i;
                        }
                        if(research_domains[i].dcterms.title != null)
                        {
                            research_domains[i].tag_face = research_domains[i].dcterms.title;
                        }
                    }

                    res.json(
                        research_domains
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages : [research_domains]
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
                error_messages : ["You did not send the autocomplete query. The request should be something like /research_domains/autocomplete?query=blablabla."]
            }
        );
    }
};

exports.all = function(req, res) {

    ResearchDomain.all(req,
        function(err, research_domains)
        {
            if(!err)
            {
                var getResearchDomainProperties = function(resultRow, cb)
                {
                    ResearchDomain.findByUri(resultRow.uri, function(err, project)
                    {
                        cb(err, project);
                    });
                };

                async.map(research_domains, getResearchDomainProperties, function(err, researchDomains)
                {
                    if(!err)
                    {
                        res.json({
                            result: "ok",
                            research_domains : researchDomains
                        });
                    }
                    else
                    {
                        var msg = "error fetching research domain information : " + err;
                        console.error(msg);

                        res.json({
                            result : "error",
                            message : msg
                        });
                    }
                });
            }
            else
            {
                res.status(500).json(
                    {
                        error_messages : [research_domains]
                    }
                );
            }
        }
    );
};

exports.edit = function(req, res) {
    var newResearchDomains = req.body;

    if(newResearchDomains instanceof Array)
    {
        async.map(newResearchDomains,
        function(domain, callback){
            new ResearchDomain(domain, function(err, rd){
                rd.save(function(err, result){
                    if(err)
                    {
                        var msg = "Error saving research domain " + JSON.stringify(domain) + " because of error " + JSON.stringify(result);
                        console.error(msg);
                    }

                    callback(err, result);
                });
            });
        },
        function(err, results){
            if(!err)
            {
                res.json({
                        result : "ok",
                        message : "All research domains saved successfully"
                    }
                );
            }
            else
            {
                res.status(500).json({
                        result : "error",
                        message : "Error updating research domains. Error reported " + JSON.stringify(results)
                    }
                );
            }
        });
    }
};

exports.delete = function(req, res) {

    var uriOfResearchDomainToDelete = decodeURI(req.params.uri);

    if(uriOfResearchDomainToDelete != null)
    {
        ResearchDomain.findByUri(uriOfResearchDomainToDelete, function(err, research_domain){
            if(!err)
            {
                if(research_domain != null)
                {
                    research_domain.deleteAllMyTriples(function(err, result){
                        if(!err)
                        {
                            res.json({
                                    result : "ok",
                                    message : "Research Domain " + uriOfResearchDomainToDelete + " deleted successfully."
                                }
                            );
                        }
                        else
                        {
                            res.status(500).json({
                                    result : "error",
                                    message : "Error deleting research domain. Error reported " + JSON.stringify(results)
                                }
                            );
                        }
                    });
                }
                else
                {
                    res.status(500).json({
                            result : "error",
                            message : "Unable to find research domain with URI " + uriOfResearchDomainToDelete + " . Error reported " + JSON.stringify(results)
                        }
                    );
                }
            }
            else
            {
                res.status(500).json({
                        result : "error",
                        message : "Error retrieving research domain. Error reported " + JSON.stringify(results)
                    }
                );
            }
        });
    }
    else
    {
        res.status(400).json({
                result : "error",
                message : "Invalid object sent in for deleting. The body of the request must contain the an 'uri' field, stating which research domain to delete"
            }
        );
    }
};