var Config = function() { return GLOBAL.Config; }();
var RecommendationUtils = require(Config.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;

var _ = require('underscore');
var async = require('async');

var recommendation_mode = RecommendationUtils.getActiveRecommender();
var recommendation;

if(recommendation_mode == "dendro_recommender")
{
    recommendation = require(Config.absPathInSrcFolder("/controllers/dr_recommendation.js")).shared;
}
else if(recommendation_mode == "standalone")
{
    recommendation = require(Config.absPathInSrcFolder("/controllers/standalone_recommendation.js")).shared;
}
else if(recommendation_mode == "project_descriptors")
{
    recommendation = require(Config.absPathInSrcFolder("/controllers/project_descriptors_recommendation.js")).shared;
}
else if(recommendation_mode == "none")
{
    recommendation = require(Config.absPathInSrcFolder("/controllers/no_recommendation.js")).shared;
}

var records = require(Config.absPathInSrcFolder("/controllers/records.js"));
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;

exports.metadata_evaluation = function(req, res)
{
    exports.shared.evaluate_metadata(req, function(err, evaluation){
        if(!err)
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
    var requestedResourceURI = req.params.requestedResource;
    var recommendationsMode = req.query.recommendations_mode;

    //ignore restrictions to favorites and smart if the
    if(!Config.recommendation.modes.none.active)
    {
        var includeOnlyFavorites = (recommendationsMode == recommendation.recommendation_options.favorites);
        var smartRecommendationMode = (recommendationsMode == recommendation.recommendation_options.smart);
    }

    var getMetadataRecommendations = function(requestedResource, callback)
    {
        if(Config.recommendation.modes.none.active)
        {
            callback(null, []);
        }
        else
        {
            if(req.session.recommendation != null && req.session.recommendation.ontologies.ontologies != null)
            {
                var recommendationOntologies = req.session.recommendation.ontologies.ontologies;
            }

            recommendation.recommend_descriptors(
                requestedResource.uri,
                req.session.user.uri,
                0,
                recommendationOntologies,
                req.index, function(err, descriptors)
                {
                    if (!err)
                    {
                        callback(null, descriptors);
                    }
                    else
                    {
                        callback(1, "Unable to retrieve metadata recommendations for uri: " + requestedResource.uri + ". Error reported : " + err + " Full Error : " + JSON.stringify(descriptors));
                    }
                },
                {
                    favorites : includeOnlyFavorites,
                    smart : smartRecommendationMode,
                    page_number : req.query.page_number,
                    page_size : req.query.page_size
                });
        }
    };

    var getMetadata = function(requestedResource, callback)
    {
        requestedResource.findMetadata(function(err, metadata){
            if(!err){
                callback(null, metadata);
            }
            else{
                callback(1, "Error finding metadata from " + requestedResource.uri + ". Error reported : " + metadata);
            }
        });
    };

    var evaluateMetadata = function(resource, metadata, recommendations){
        var not_completed_descriptors = [];
        var recommendations_score = 0;
        var metadata_score = 0;

        if (includeOnlyFavorites && !Config.recommendation.modes.none.active)
        {
            recommendations = _.filter(recommendations, function(recommendation){
                return recommendation.recommendation_types.project_favorite || recommendation.recommendation_types.user_favorite;
            });
        }

        _.each(recommendations, function(element, index, list){

            var correspondence = _.find(metadata, function(descriptor){
                return element.uri == descriptor.uri;
            });

            var element_evaluation = _.clone(element);

            if(correspondence == null){
                not_completed_descriptors.push(element_evaluation);
            }
            else{
                metadata_score += element_evaluation.score;
            }

            if(element_evaluation.score != null)
            {
                recommendations_score += element_evaluation.score;
            }
        });

        var metadata_evaluation_value = 0;

        if(recommendations_score != 0)
        {
            metadata_evaluation_value = Math.round((metadata_score/recommendations_score)*100);
        }

        var metadata_evaluation = {
            result : "ok",
            evaluation: metadata_evaluation_value,
            missing_descriptors: not_completed_descriptors
        };

        return metadata_evaluation;
    };

    var calculateQuality = function(err, requestedResource)
    {
        if (!err)
        {
            if (requestedResource != null)
            {
                async.series([

                        function(callback){
                            getMetadataRecommendations(requestedResource, callback);
                        },
                        function(callback)
                        {
                            getMetadata(requestedResource, callback);
                        }
                    ],
                    function(err, results){
                        if(err){
                            var error = results;
                            console.log(error);
                            callback(1, error);
                        }
                        else{
                            var recommendations = results[0];

                            var metadata;
                            if(results.length == 2 && results[1].descriptors instanceof Array)
                            {
                                metadata = results[1].descriptors;
                            }
                            else
                            {
                                metadata = [];
                            }


                            var metadata_evaluation = evaluateMetadata(requestedResource, metadata, recommendations);
                            callback(null, metadata_evaluation);
                        }
                    });
            }
            else
            {
                callback(1, "Unable to find resource with uri " + requestedResourceURI + " in this Dendro instance when retrieving metadata during metadata quality evaluation.");
            }
        }
        else
        {
            callback(1, "Error "+err+" fetching metadata for resource " + requestedResourceURI + ": " + requestedResource);
        }
    }


    if(req.params.is_project_root)
    {
        Project.findByUri(requestedResourceURI, calculateQuality);
    }
    else
    {
        InformationElement.findByUri(requestedResourceURI, calculateQuality);
    }
};