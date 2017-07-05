var path = require('path');
const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

function UserMapper ()
{
    var self = this;
}

UserMapper.map = function (userUri, callback)
{
    User.findByUri(userUri, function(err, user){

        Descriptor.removeUnauthorizedFromObject(user, [Config.types.private, Config.types.locked], []);

        if(!err && !isNull(user))
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