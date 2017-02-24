var Config = function() { return GLOBAL.Config; }();
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var _ = require('underscore');
var async = require('async');


exports.recommend_descriptors = function(req, res) {
    var page_number = req.query.page;
    var page_size = req.query.page_size;

    exports.shared.recommend_descriptors(function(err, descriptors){
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
    }, page_number, page_size);
}

exports.shared = {};

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(callback, page_number, page_size)
{
    var ontologyUris = _.map(Config.public_ontologies, function(prefix){
        return Ontology.allOntologies[prefix].uri;
    });

    Descriptor.all_in_ontologies(ontologyUris, function(err, descriptors){
        if(!err)
        {
            callback(null, descriptors);
        }
        else
        {
            callback(err, []);
        }
    }, page_number, page_size);


};