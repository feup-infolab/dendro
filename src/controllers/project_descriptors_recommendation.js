var Config = function() { return GLOBAL.Config; }();
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var _ = require('underscore');
var async = require('async');


exports.recommend_descriptors = function(req, res) {

    var resourceUri = req.params.requestedResource;

    if(req.session.user != null)
    {
        var userUri = req.session.user.uri;
    }
    else
    {
        var userUri = null;
    }

    var allowedOntologies = _.map(Config.public_ontologies, function(prefix){
        return Ontology.allOntologies[prefix].uri;
    });

    var indexConnection = req.index;

    exports.shared.recommend_descriptors(resourceUri, userUri, req.query.page, allowedOntologies, indexConnection, function(err, descriptors){
        if(!err)
        {
            res.json(
                {
                    result : "ok",
                    descriptors : descriptors
                }
            );
        }
        else
        {
            res.status(500).json({
                result : "error",
                message : "There was an error fetching the descriptors",
                error : results
            })
        }
    }, {
        page_number : req.query.page,
        page_size : req.query.page_size
    });
}

exports.shared = {};

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
     if(allowedOntologies == null)
     {
         allowedOntologies = _.map(Config.public_ontologies, function(prefix){
             return Ontology.allOntologies[prefix].uri;
         });
     }

    Descriptor.all_in_ontologies(allowedOntologies, function(err, descriptors){
        if(!err)
        {
            var uuid = require('uuid');
            var recommendation_call_id = uuid.v4();
            var recommendation_call_timestamp = new Date().toISOString();
            
            for(let i = 0; i < descriptors.length; i++)
            {
                descriptors[i].recommendation_types = {};
                descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                descriptors[i].recommendationCallId = recommendation_call_id;
                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }
            
            callback(null, descriptors);
        }
        else
        {
            callback(err, []);
        }
    }, options.page_number, options.page_size);


};