const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const async = require("async");
const _ = require("underscore");

exports.recommend_descriptors = function(req, res) {
    if(!isNull(req.params.requestedResourceUri))
    {
        if(!isNull(req.user))
        {
            const recommendationMode = req.query.recommendations_mode;
            const recommendAlreadyFilledIn = (req.query.recommend_already_filled_in === "true" || req.query.recommend_already_filled_in === true);

            const getAllowedOntologies = function () {
                if (!isNull(req.user.recommendations) && !isNull(req.user.recommendations.ontologies)) {
                    const acceptedOntologies = req.user.recommendations.ontologies.accepted;
                    const fullOntologies = [];

                    for (let prefix in acceptedOntologies) {
                        if (acceptedOntologies.hasOwnProperty(prefix)) {
                            const ontology = new Ontology({
                                prefix: prefix
                            });

                            fullOntologies.push(ontology.uri);
                        }
                    }

                    return fullOntologies;
                }
            };

            const registerRecommendationRequestInteraction = function () {
                if (!isNull(req.query.page)) {
                    let oldPage = req.user.recommendations.descriptor_page;

                    if (isNull(oldPage)) {
                        oldPage = 0;
                    }

                    const newPage = parseInt(req.query.page);

                    req.user.recommendations.descriptor_page = newPage;

                    let interactionType;

                    if (newPage === (oldPage + 1)) {
                        interactionType = Interaction.types.browse_to_next_page_in_descriptor_list.key;
                    }
                    else if (newPage === (oldPage - 1)) {
                        interactionType = Interaction.types.browse_to_previous_page_in_descriptor_list.key;
                    }

                    if (!isNull(interactionType)) {
                        const lastRecommendationList = JSON.stringify(req.user.recommendations.lastRecommendationList);

                        Interaction.create(
                            {
                                ddr: {
                                    performedBy: req.user.uri,
                                    interactionType: interactionType,
                                    lastDescriptorRecommendationsList: lastRecommendationList,
                                    originallyRecommendedFor: req.params.requestedResourceUri
                                }
                            },
                            function (err, interaction) {
                                if (isNull(err) && !isNull(interaction)) {
                                    interaction.save(function (err, interaction) {
                                        if (err) {
                                            console.err("Unable to record interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list. ");
                                        }
                                        else {
                                            console.log("Successfully recorded interaction of type " + interactionType + " for shifting between pages in the descriptor recommender list in resource with uri " + req.params.requestedResourceUri);
                                        }
                                    });
                                }
                            });
                    }
                }
            };

            const allowedOntologies = getAllowedOntologies();

            exports.shared.recommend_descriptors(req.params.requestedResourceUri, req.user.uri, req.query.page, allowedOntologies, req.index, function(err, descriptors){
                if(isNull(err))
                {
                    registerRecommendationRequestInteraction();

                    req.user.recommendations.lastRecommendationList = descriptors;
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
                            error_messages : ["Error producing metadata recommendations for resource " + req.params.requestedResourceUri + " . Error reported : " + descriptors]
                        }
                    );
                }
            },
            {
                favorites : (recommendationMode === exports.shared.recommendation_options.favorites),
                smart : (recommendationMode === exports.shared.recommendation_options.smart),
                hidden : (recommendationMode === exports.shared.recommendation_options.hidden),
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
                error_messages : ["Resource with uri ." + req.params.requestedResourceUri + " does not exist in this Dendro instance."]
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
    const ie = new InformationElement(
        {
            uri: resourceUri
        }
    );

    ie.getOwnerProject(function(err, project){
        const projectUri = project.uri;
        const includeOnlyFavorites = !isNull(options) && options[exports.shared.recommendation_options.favorites];
        const smartRecommendationMode = !isNull(options) && options[exports.shared.recommendation_options.smart];
        const includeOnlyHiddenDescriptors = !isNull(options) && options[exports.shared.recommendation_options.hidden];
        const recommendAlreadyFilledIn = !isNull(options) && options[exports.shared.recommendation_options.recommend_already_filled_in];

        const removeLockedAndPrivate = function (results) {
            const filtered = _.filter(results, function (result) {
                let isLockedOrPrivate = (result.locked || result.private);
                return !isLockedOrPrivate;
            });

            return filtered;
        };

        const getRecommendationsFromDR = function (resourceUri, callback) {
            const requestedResource = new InformationElement({
                uri: resourceUri
            });

            requestedResource.findMetadata(function (err, metadata) {
                if (isNull(err) && !isNull(metadata)) {
                    const request = require("request");
                    const DRUrl = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/recommendations/recommend";

                    const qs = {
                        project: projectUri,
                        current_resource: resourceUri,
                        user: userUri,
                        current_metadata: JSON.stringify(metadata),
                        recommend_already_filled_in: recommendAlreadyFilledIn,
                        allowed_ontologies: JSON.stringify(allowedOntologies)
                    };

                    if (recommendAlreadyFilledIn) {
                        qs.recommend_already_filled_in = "true";
                    }
                    else {
                        qs.recommend_already_filled_in = "false";
                    }

                    if (isNull(page)) {
                        qs.number_of_recommendations = Config.recommendation.recommendation_page_size;
                    }
                    else {
                        qs.page = page;
                        qs.page_size = Config.recommendation.recommendation_page_size;
                    }

                    if (includeOnlyFavorites) {
                        qs.descriptor_filter = 'favorites';
                    }
                    else if (includeOnlyHiddenDescriptors) {
                        qs.descriptor_filter = 'hidden';
                    }
                    else {
                        qs.descriptor_filter = 'all';
                    }
                    request.post(
                        {
                            url: DRUrl,
                            form: qs,
                            headers: [
                                {
                                    name: 'Accept',
                                    value: 'application/json'
                                }
                            ]
                        },
                        function (error, response) {
                            if (isNull(error)) {
                                if (!isNull(response.body)) {
                                    try {
                                        const parsedBody = JSON.parse(response.body);

                                        const recommendations = parsedBody.recommendations;

                                        if (!isNull(recommendations) && recommendations instanceof Array) {
                                            async.mapSeries(recommendations, function (recommendation, cb) {
                                                    Descriptor.findByUri(recommendation.uri, function (err, fetchedDescriptor) {
                                                        if (isNull(err)) {
                                                            if (isNull(fetchedDescriptor)) {
                                                                cb(1, "Descriptor " + recommendation.uri + " is not present in this Dendro instance. Check your Virtuoso parametrization to see if it exists in its own graph.");
                                                            }
                                                            else {
                                                                fetchedDescriptor.score = recommendation.score;

                                                                if (typeof recommendation.recommendation_types !== "undefined") {
                                                                    fetchedDescriptor.recommendation_types = recommendation.recommendation_types;
                                                                }
                                                                else {
                                                                    fetchedDescriptor.recommendation_types = {};
                                                                }

                                                                cb(0, fetchedDescriptor);
                                                            }
                                                        }
                                                        else {
                                                            cb(1, "Unable to fetch descriptor data after getting recommendations from Dendro Recommender");
                                                        }
                                                    });
                                                },
                                                function (err, results) {
                                                    return callback(err, results);
                                                });
                                        }
                                        else {
                                            return callback(1, "Unable to fetch recommendations from Dendro Recommender : no \"recommendations\" field at the root of JSON response from Dendro Recommender or it is not an array of object recommendations.");
                                        }
                                    }
                                    catch (exc) {
                                        return callback(1, "Unable to fetch recommendations from Dendro Recommender : invalid JSON response from recommender server.");
                                    }
                                }
                                else {
                                    return callback(1, "Unable to fetch recommendations from Dendro Recommender : Null Body on HTTP response from DR Server.");
                                }
                            }
                            else {
                                return callback(1, "Unable to fetch recommendations from Dendro Recommender");
                            }
                        }
                    );
                }
                else {
                    return callback(err, "Unable to fetch resource with uri " + resourceUri + " when retrieving current metadata to send to the dendro recommender.");
                }
            });
        };
    });

    getRecommendationsFromDR(resourceUri, function(err, results)
    {
        if(isNull(err))
        {
            results = removeLockedAndPrivate(results);

            const uuid = require("uuid");
            const recommendation_call_id = uuid.v4();
            const recommendation_call_timestamp = new Date().toISOString();
            
            for(let i = 0; i < results.length; i++)
            {
                results[i].recommendationCallId = recommendation_call_id;
                results[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }

            return callback(null, results);
        }
        else
        {
            return callback(1, results);
        }
    });
};