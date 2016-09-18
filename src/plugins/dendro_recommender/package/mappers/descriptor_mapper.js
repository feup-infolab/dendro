var path = require('path');

var Config = require(path.join(path.dirname(require.main.filename), "models", "meta", "config.js")).Config;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;


function DescriptorMapper ()
{
    var self = this;
}

DescriptorMapper.map = function(descriptorUri, callback)
{
    Descriptor.findByUri(descriptorUri, function(err, descriptor){

        if(!err && descriptor != null)
        {
            var result = {
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