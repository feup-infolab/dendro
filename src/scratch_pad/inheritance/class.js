var Descriptor = require("../descriptor.js").Descriptor;
var Resource  = require("../descriptor.js").Resource;

function Class (){}

//TODO determine this on server startup, from persisted information in the graph?
Class.allClasses = function()
{
    console.log("working at : " + process.cwd());

    return {
        "nfo:FileDataObject" : require("../directory_structure/file.js").File,
        "nie:Folder" : require("../directory_structure/file.js").Folder,
        "nie:InformationElement" : require("../directory_structure/information_element.js").InformationElement,
        "ddr:ExternalRepository" : require("../harvesting/external_repository.js").ExternalRepository,
        "ddr:HarvestedResource" : require("../harvesting/harvested_resource.js").HarvestedResource,
        "ddr:Project" : require("../project.js").Project,
        "ddr:Resource" : require("../resource.js").Resource,
        "ddr:User" : require("../user.js").User
    };
}();

Class.getClassOf = function(obj, callback)
{
    var resource = new Resource(obj);

    var matchType = function(type)
    {
        var typeDescriptor = new Descriptor(
            {
                uri : type
            }
        );

        var descriptorPrefixedForm = typeDescriptor.getPrefixedForm();
        return Class.allClasses[descriptorPrefixedForm];
    }

    if(obj.rdf.type != null)
    {
        return matchType(obj.rdf.type);
    }
    else
    {
        resource.descriptorValue("rdf:type", function(err, type)
        {
            if(!err)
            {
                var type = matchType(obj.rdf.type);
                if(type != null)
                {
                    callback(null, type);
                }
                else
                {
                    callback(1, "Type  \" " + type + " \" does not match aney class");
                }
            }
            else
            {
                callback(1, "Unable to determine type of resource with uri : " + obj.uri );
            }
        });
    }
};

module.exports.Class = Class;