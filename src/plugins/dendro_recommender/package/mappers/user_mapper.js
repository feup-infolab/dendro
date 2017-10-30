const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

var User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
var Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

function UserMapper ()
{
    var self = this;
}

UserMapper.map = function (userUri, callback)
{
    User.findByUri(userUri, function(err, user){

        Descriptor.removeUnauthorizedFromObject(user, [Elements.access_types.private, Elements.access_types.locked], []);

        if(isNull(err) && !isNull(user))
        {
            const result = {
                entity_type : {
                    identifier : Ontology.allOntologies.ddr.uri + "User",
                    name : "Dendro User",
                    description : "A user of the Dendro system"
                },
                identifier: user.uri,
                fields : user
            };

            callback(null, result);
        }
        else
        {
            callback(err, user);
        }
    });
};

module.exports.UserMapper = UserMapper;