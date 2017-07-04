var DescriptorMapper = require("mappers/descriptor_mapper.js").DescriptorMapper;
var InteractionMapper = require("mappers/interaction_mapper.js").InteractionMapper;
var UserMapper = require("mappers/user_mapper.js").UserMapper;

var DRConnection = require("connection.js").Connection;

function Mapper (connection)
{
    var self = this;
    self.active = false;
    self.connection = connection;
}

Mapper.register_in_recommender = function(object, callback)
{
    var mappedObject = Mapper.map(object);

    DRConnection.send("POST", mappedObject, Mapper.getEndpoint(object), function(err, result){
        if(!err)
        {
            callback(null, result);
        }
        else
        {
            callback(err, result);
        }
    });
};

Mapper.getEndpoint = function(object)
{
    var objectClassName = object.constructor.name;
    var mapper = Mapper.mappingsTable[objectClassName];

    if(mapper != null)
    {
        var mappedObject = mapper.endpoint;
        return mappedObject;
    }
};

Mapper.map = function(object)
{
    var objectClassName = object.constructor.name;
    var mapper = Mapper.mappingsTable[objectClassName];

    if(mapper != null)
    {
        var mappedObject = mapper.mapperClass.map(object);
        return mappedObject;
    }
};

Mapper.mappingsTable = {
    "user" : {
        mapperClass: UserMapper,
        endpoint: "/entities"
    },
    "descriptor" : {
        mapperClass: DescriptorMapper,
        endpoint : "/entities"
    },
    "interaction" : {
        mapperClass: InteractionMapper,
        endpoint: "/facts"
    }
};

module.exports.DRMapper = Mapper;