var path = require('path');

const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;


function DescriptorMapper ()
{
    var self = this;
}

DescriptorMapper.map = function(descriptorUri, callback)
{
    Descriptor.findByUri(descriptorUri, function(err, descriptor){

        if(!err && !isNull(descriptor))
        {
            let result = {
                entity_type : {
                    identifier : Ontology.allOntologies.ddr.uri + "Descriptor",
                    name : "Dendro Descriptor",
                    description : "A descriptor registered in the Dendro system"
                },
                identifier: descriptorUri,
                fields: descriptor
            };

            callback(null, result);
        }
        else
        {
            callback(err, descriptor);
        }
    });
};

module.exports.DescriptorMapper = DescriptorMapper;