var path = require('path');

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var UserMapper = require("./user_mapper.js").UserMapper;
var DescriptorMapper = require("./descriptor_mapper.js").DescriptorMapper;
var _ = require('underscore');
var async = require('async');

function InteractionMapper ()
{
    var self = this;
}

InteractionMapper.map = function(interactionObject, callback)
{
    if(!interactionObject instanceof Array)
    {
        interactionObject = [interactionObject];
    }

    var mapInteraction = function(interactionObject, callback)
    {
        async.waterfall([
                function(callback){
                    UserMapper.map(interactionObject.ddr.performedBy, function(err, user){
                        callback(err, user);
                    });
                },
                function(user, callback){
                    DescriptorMapper.map(interactionObject.ddr.executedOver, function(err, descriptor)
                    {
                        callback(err, user, descriptor);
                    });
                }
        ],function(err, fullUser, fullDescriptor)
            {
                var result =
                {
                    fact_type : {
                        identifier : Ontology.allOntologies.ddr.uri + "Interaction",
                        name : "User-Descriptor interaction",
                        description : "An interaction between an user and a descriptor"
                    },

                    identifier: interactionObject.uri,
                    mouse : fullUser,
                    cheese : fullDescriptor,

                    fields : {
                        value : interactionObject.ddr.interactionType,
                        interaction_registered_on : interactionObject.dcterms.created
                    }
                };

                callback(err, result);
            }
        );
    };

    async.map(interactionObject, mapInteraction, function(err, mapped){
        callback(err, mapped);
    });
};

module.exports.InteractionMapper = InteractionMapper;