const path = require("path");
const Pathfinder = global.Pathfinder;const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Project = require(Pathfinder.absPathInSrcFolder("/models//project.js")).Project;
const RecommendationUtils = require(Pathfinder.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;

const _ = require("underscore");
const async = require("async");

const recommendation_mode = RecommendationUtils.getActiveRecommender();
let recommendation;

if(recommendation_mode === "dendro_recommender")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/dr_recommendation.js")).shared;
}
else if(recommendation_mode === "standalone")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/standalone_recommendation.js")).shared;
}
else if(recommendation_mode === "project_descriptors")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/project_descriptors_recommendation.js")).shared;
}
else if(recommendation_mode === "none")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/no_recommendation.js")).shared;
}

const records = require(Pathfinder.absPathInSrcFolder("/controllers/records.js"));
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;

exports.metadata_evaluation = function(req, res)
{
    exports.shared.evaluate_metadata(req, function(err, evaluation){
        if(isNull(err))
        {
            res.json(evaluation);
        }
        else
        {
            res.status(500).json({
                result : "error",
                message : evaluation
            });
        }
    });
};

exports.shared = {};

exports.shared.evaluate_metadata = function(req, callback)
{
    const requestedResourceURI = req.params.requestedResourceUri;
    const recommendationsMode = req.query.recommendations_mode;
    let includeOnlyFavorites = false;
    let smartRecommendationMode = false;

    //ignore restrictions to favorites and smart if the
    if(!Config.recommendation.modes.none.active)
    {
        includeOnlyFavorites = (recommendationsMode === recommendation.recommendation_options.favorites);
        smartRecommendationMode = (recommendationsMode === recommendation.recommendation_options.smart);
    }

    const getMetadataRecommendations = function (requestedResource, callback) {
        if (Config.recommendation.modes.none.active) {
            return callback(null, []);
        }
        else {
            if (!isNull(req.session.recommendation) && !isNull(req.session.recommendation.ontologies.ontologies)) {
                var recommendationOntologies = req.session.recommendation.ontologies.ontologies;
            }

            recommendation.recommend_descriptors(
                requestedResource.uri,
                req.user.uri,
                0,
                recommendationOntologies,
                req.index, function (err, descriptors) {
                    if (isNull(err)) {
                        return callback(null, descriptors);
                    }
                    else {
                        return callback(1, "Unable to retrieve metadata recommendations for uri: " + requestedResource.uri + ". Error reported : " + err + " Full Error : " + JSON.stringify(descriptors));
                    }
                },
                {
                    favorites: includeOnlyFavorites,
                    smart: smartRecommendationMode,
                    page_number: req.query.page_number,
                    page_size: req.query.page_size
                });
        }
    };

    const getMetadata = function (requestedResource, callback) {
        requestedResource.findMetadata(function (err, metadata) {
            if (isNull(err)) {
                return callback(null, metadata);
            }
            else {
                return callback(1, "Error finding metadata from " + requestedResource.uri + ". Error reported : " + metadata);
            }
        }, true);
    };

    const evaluateMetadata = function (resource, metadata, recommendations) {
        const not_completed_descriptors = [];
        let recommendations_score = 0;
        let metadata_score = 0;

        if (includeOnlyFavorites && !Config.recommendation.modes.none.active) {
            recommendations = _.filter(recommendations, function (recommendation) {
                return recommendation.recommendation_types.project_favorite || recommendation.recommendation_types.user_favorite;
            });
        }

        _.each(recommendations, function (element, index, list) {

            const correspondence = _.find(metadata, function (descriptor) {
                return element.uri === descriptor.uri;
            });

            const element_evaluation = _.clone(element);

            if (isNull(correspondence)) {
                not_completed_descriptors.push(element_evaluation);
            }
            else {
                metadata_score += element_evaluation.score;
            }

            if (typeof element_evaluation.score !== "undefined") {
                recommendations_score += element_evaluation.score;
            }
        });

        let metadata_evaluation_value = 0;

        if (recommendations_score !== 0) {
            metadata_evaluation_value = Math.round((metadata_score / recommendations_score) * 100);
        }

        const metadata_evaluation = {
            result: "ok",
            evaluation: metadata_evaluation_value,
            missing_descriptors: not_completed_descriptors
        };

        return metadata_evaluation;
    };

    const calculateQuality = function (err, requestedResource) {
        if (isNull(err)) {
            if (!isNull(requestedResource)) {
                async.series([

                        function (callback) {
                            getMetadataRecommendations(requestedResource, callback);
                        },
                        function (callback) {
                            getMetadata(requestedResource, callback);
                        }
                    ],
                    function (err, results) {
                        if (err) {
                            const error = results;
                            console.log(error);
                            return callback(1, error);
                        }
                        else {
                            const recommendations = results[0];

                            let metadata;
                            if (results.length === 2 && results[1].descriptors instanceof Array) {
                                metadata = results[1].descriptors;
                            }
                            else {
                                metadata = [];
                            }


                            const metadata_evaluation = evaluateMetadata(requestedResource, metadata, recommendations);
                            return callback(null, metadata_evaluation);
                        }
                    });
            }
            else {
                return callback(1, "Unable to find resource with uri " + requestedResourceURI + " in this Dendro instance when retrieving metadata during metadata quality evaluation.");
            }
        }
        else {
            return callback(1, "Error " + err + " fetching metadata for resource " + requestedResourceURI + ": " + requestedResource);
        }
    };


    if(req.params.is_project_root)
    {
        Project.findByUri(requestedResourceURI, calculateQuality);
    }
    else
    {
        InformationElement.findByUri(requestedResourceURI, calculateQuality);
    }
};