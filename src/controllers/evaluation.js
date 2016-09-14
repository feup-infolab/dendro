var Config = require('../models/meta/config.js').Config;

var _ = require('underscore');
var async = require('async');

var recommendation;

if(Config.recommendation.modes.dendro_recommender.active)
{
    recommendation = require(Config.absPathInProject("/controllers/dr_recommendation.js")).shared;
}
else if(Config.recommendation.modes.standalone.active)
{
    recommendation = require(Config.absPathInProject("/controllers/standalone_recommendation.js")).shared;
}
else if(Config.recommendation.modes.none.active)
{
    recommendation = require(Config.absPathInProject("/controllers/no_recommendation.js")).shared;
}

var records = require(Config.absPathInProject("/controllers/records.js"));
var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInProject("/models/meta/descriptor.js")).Descriptor;
var Ontology = require(Config.absPathInProject("/models/meta/ontology.js")).Ontology;

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
            if(Config.baselines.dublin_core_only)
            {
                var recommendationOntologies = [Ontology.allOntologies['dcterms'].uri];
            }
            else if(req.session.recommendation != null && req.session.recommendation.ontologies.ontologies != null)
            {
                var recommendationOntologies = req.session.recommendation.ontologies.ontologies;
            }

            if(Config.baselines.dublin_core_only && Config.recommendation.modes.none.active)
            {
                Descriptor.DCElements(function(err, descriptors)
                {
                    for(var i = 0; i < descriptors.length; i++)
                    {
                        //all elements will have the same score (No difference in importance)
                        descriptors[i].score = 1;
                        var dc_element_forced_rec_type = Descriptor.recommendation_types.dc_element_forced.key;

                        if(descriptors[i].recommendation_types == null)
                        {
                            descriptors[i].recommendation_types = {};
                        }

                        descriptors[i].recommendation_types[dc_element_forced_rec_type] = true;
                    }

                    callback(null, descriptors);
                });
            }
            else
            {
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
                        smart : smartRecommendationMode
                    });
            }
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

    Resource.findByUri(requestedResourceURI, function (err, requestedResource)
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
    });
};