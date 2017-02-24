var Config = function() { return GLOBAL.Config; }();

var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;

var async = require('async');
var _ = require('underscore');

exports.recommend_descriptors = function(req, res) {
    if(req.params.requestedResource != null)
    {
        if(req.session.user != null)
        {
            var recommendationMode = req.query.recommendations_mode;
            var recommendAlreadyFilledIn = (req.query.recommend_already_filled_in === "true" || req.query.recommend_already_filled_in === true);

            var getAllowedOntologies = function()
            {
                if(req.session.user.recommendations != null && req.session.user.recommendations.ontologies != null)
                {
                    var acceptedOntologies = req.session.user.recommendations.ontologies.accepted;
                    var fullOntologies = [];

                    for(var prefix in acceptedOntologies)
                    {
                        if(acceptedOntologies.hasOwnProperty(prefix))
                        {
                            var ontology = new Ontology({
                                prefix : prefix
                            });

                            fullOntologies.push(ontology.uri);
                        }
                    }

                    return fullOntologies;
                }
            };

            var registerRecommendationRequestInteraction = function()
            {
                if(req.query.page != null)
                {
                    var oldPage = req.session.user.recommendations.descriptor_page;

                    if(oldPage == null)
                    {
                        oldPage = 0;
                    }

                    var newPage = parseInt(req.query.page);

                    req.session.user.recommendations.descriptor_page = newPage;

                    var interactionType;

                    if(newPage == (oldPage + 1))
                    {
                        interactionType = Interaction.types.browse_to_next_page_in_descriptor_list.key;
                    }
                    else if(newPage == (oldPage - 1))
                    {
                        interactionType = Interaction.types.browse_to_previous_page_in_descriptor_list.key;
                    }

                    if(interactionType != null)
                    {
                        var lastRecommendationList = JSON.stringify(req.session.user.recommendations.lastRecommendationList);

                        new Interaction(
                            {
                                ddr : {
                                    performedBy : req.session.user.uri,
                                    interactionType : interactionType,
                                    lastDescriptorRecommendationsList : lastRecommendationList,
                                    originallyRecommendedFor : req.params.requestedResource
                                }
                            },
                            function(err, interaction){
                                if(!err && interaction != null)
                                {
                                    interaction.save(function(err, interaction){
                                        if(err)
                                        {
                                            console.err("Unable to record interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list. ");
                                        }
                                        else
                                        {
                                            console.log("Successfully recorded interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list in resource with uri " + req.params.requestedResource);
                                        }
                                    });
                                }
                            });
                    }
                }
            };

            var allowedOntologies = getAllowedOntologies();

            exports.shared.recommend_descriptors(req.params.requestedResource, req.session.user.uri, req.query.page, allowedOntologies, req.index, function(err, descriptors){
                if(!err)
                {
                    registerRecommendationRequestInteraction();

                    req.session.user.recommendations.lastRecommendationList = descriptors;
                    res.json(
                        {
                            result : "ok",
                            descriptors : descriptors
                        }
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            result : "error",
                            error_messages : ["Error producing metadata recommendations for resource " + req.params.requestedResource + " . Error reported : " + descriptors]
                        }
                    );
                }
            },
            {
                favorites : (recommendationMode == exports.shared.recommendation_options.favorites),
                smart : (recommendationMode == exports.shared.recommendation_options.smart),
                hidden : (recommendationMode == exports.shared.recommendation_options.hidden),
                recommend_already_filled_in : recommendAlreadyFilledIn
            });
        }
        else
        {
            res.status(400).json(
                {
                    result : "error",
                    error_messages : ["No user is authenticated in the system, so no metadata recommendations can be obtained."]
                }
            );
        }
    }
    else
    {
        res.status(404).json(
            {
                result : "error",
                error_messages : ["Resource with uri ." + req.params.requestedResource + " does not exist in this Dendro instance."]
            }
        );
    }
};

exports.shared = {};


/**
 * Recommends a page of descriptors
 * @param resourceUri
 * @param userUri
 * @param page
 * @param allowedOntologies
 * @param indexConnection
 * @param callback
 * @param options favorites_only : choose from favorite descriptors only
 */

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden",
    recommend_already_filled_in : "recommend_already_filled_in"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    var ie = new InformationElement(
        {
            uri: resourceUri
        }
    );

    var projectUri = ie.getOwnerProjectFromUri();
    var includeOnlyFavorites = options != null && options[exports.shared.recommendation_options.favorites];
    var smartRecommendationMode = options != null && options[exports.shared.recommendation_options.smart];
    var includeOnlyHiddenDescriptors = options != null && options[exports.shared.recommendation_options.hidden];
    var recommendAlreadyFilledIn = options != null && options[exports.shared.recommendation_options.recommend_already_filled_in];

    var removeLockedAndPrivate = function(results)
    {
        var filtered = _.filter(results, function(result){
            var isLockedOrPrivate =  (result.locked || result.private);
            return !isLockedOrPrivate;
        });

        return filtered;
    };

    var getRecommendationsFromDR = function(resourceUri, callback)
    {
        var requestedResource = new InformationElement({
            uri : resourceUri
        });

        requestedResource.findMetadata(function(err, metadata){
            if(!err && metadata != null)
            {
                var request = require('request');
                var DRUrl = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/recommendations/recommend";

                var qs = {
                    project : projectUri,
                    current_resource : resourceUri,
                    user : userUri,
                    current_metadata : JSON.stringify(metadata),
                    recommend_already_filled_in : recommendAlreadyFilledIn,
                    allowed_ontologies : JSON.stringify(allowedOntologies)
                };

                if(recommendAlreadyFilledIn)
                {
                    qs.recommend_already_filled_in = "true";
                }
                else
                {
                    qs.recommend_already_filled_in = "false";
                }

                if(page == null)
                {
                    qs.number_of_recommendations = Config.recommendation.recommendation_page_size;
                }
                else
                {
                    qs.page = page;
                    qs.page_size = Config.recommendation.recommendation_page_size;
                }

                if(includeOnlyFavorites)
                {
                    qs.descriptor_filter = 'favorites';
                }
                else if(includeOnlyHiddenDescriptors)
                {
                    qs.descriptor_filter = 'hidden';
                }
                else
                {
                    qs.descriptor_filter = 'all';
                };

                request.post(
                    {
                        url: DRUrl,
                        form: qs,
                        headers :
                            [
                                {
                                    name: 'Accept',
                                    value: 'application/json'
                                }
                            ]
                    },
                    function (error, response)
                    {
                        if (!error)
                        {
                            if(response.body != null)
                            {
                                try{
                                    var parsedBody = JSON.parse(response.body);

                                    var recommendations = parsedBody.recommendations;

                                    if(recommendations != null && recommendations instanceof Array)
                                    {
                                        async.map(recommendations, function(recommendation, cb)
                                            {
                                                Descriptor.findByUri(recommendation.uri, function(err, fetchedDescriptor){
                                                    if(!err)
                                                    {
                                                        if(fetchedDescriptor == null)
                                                        {
                                                            cb(1, "Descriptor " + recommendation.uri + " is not present in this Dendro instance. Check your Virtuoso parametrization to see if it exists in its own graph.");
                                                        }
                                                        else
                                                        {
                                                            fetchedDescriptor.score = recommendation.score;

                                                            if(recommendation.recommendation_types != null)
                                                            {
                                                                fetchedDescriptor.recommendation_types = recommendation.recommendation_types;
                                                            }
                                                            else
                                                            {
                                                                fetchedDescriptor.recommendation_types = {};
                                                            }

                                                            cb(0, fetchedDescriptor);
                                                        }
                                                    }
                                                    else
                                                    {
                                                        cb(1, "Unable to fetch descriptor data after getting recommendations from Dendro Recommender");
                                                    }
                                                });
                                            },
                                            function(err, results)
                                            {
                                                callback(err, results);
                                            });
                                    }
                                    else
                                    {
                                        callback(1, "Unable to fetch recommendations from Dendro Recommender : no \"recommendations\" field at the root of JSON response from Dendro Recommender or it is not an array of object recommendations.");
                                    }
                                }
                                catch(exc)
                                {
                                    callback(1, "Unable to fetch recommendations from Dendro Recommender : invalid JSON response from recommender server.");
                                }
                            }
                            else
                            {
                                callback(1, "Unable to fetch recommendations from Dendro Recommender : Null Body on HTTP response from DR Server.");
                            }
                        }
                        else
                        {
                            callback(1, "Unable to fetch recommendations from Dendro Recommender");
                        }
                    }
                );
            }
            else
            {
                callback(err, "Unable to fetch resource with uri " + resourceUri + " when retrieving current metadata to send to the dendro recommender.");
            }
        });
    };

    getRecommendationsFromDR(resourceUri, function(err, results)
    {
        if(!err)
        {
            results = removeLockedAndPrivate(results);
            callback(null, results);
        }
        else
        {
            callback(1, results);
        }
    });
};