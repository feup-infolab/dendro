const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const _ = require("underscore");
const async = require("async");


exports.recommend_descriptors = function(req, res) {

    const acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");

    if(!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message : "HTML Request not valid for this route."
        });
    }
    else
    {
        const resourceUri = req.params.requestedResourceUri;

        if(!isNull(req.user))
        {
            var userUri = req.user.uri;
        }
        else
        {
            var userUri = null;
        }

        const allowedOntologies = _.map(Config.public_ontologies, function (prefix) {
            return Ontology.allOntologies[prefix].uri;
        });

        const indexConnection = req.index;

        exports.shared.recommend_descriptors(resourceUri, userUri, req.query.page, allowedOntologies, indexConnection, function(err, descriptors){
            if(isNull(err))
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
};

exports.shared = {};

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
     if(isNull(allowedOntologies))
     {
         allowedOntologies = _.map(Config.public_ontologies, function(prefix){
             return Ontology.allOntologies[prefix].uri;
         });
     }

    Descriptor.all_in_ontologies(allowedOntologies, function(err, descriptors){
        if(isNull(err))
        {
            const uuid = require("uuid");
            const recommendation_call_id = uuid.v4();
            const recommendation_call_timestamp = new Date().toISOString();
            
            for(let i = 0; i < descriptors.length; i++)
            {
                descriptors[i].recommendation_types = {};
                descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                descriptors[i].recommendationCallId = recommendation_call_id;
                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }
            
            return callback(null, descriptors);
        }
        else
        {
            return callback(err, []);
        }
    }, options.page_number, options.page_size);


};