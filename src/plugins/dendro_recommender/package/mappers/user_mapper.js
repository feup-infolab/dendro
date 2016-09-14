var path = require('path');
var Config = require(path.join(path.dirname(require.main.filename), "models", "meta", "config.js")).Config;

var User = require(Config.absPathInProject("/models/user.js")).User;
var Ontology = require(Config.absPathInProject("/models/meta/ontology.js")).Ontology;
var Descriptor = require(Config.absPathInProject("/models/meta/descriptor.js")).Descriptor;

function UserMapper ()
{
    var self = this;
}

UserMapper.map = function (userUri, callback)
{
    User.findByUri(userUri, function(err, user){

        Descriptor.removeUnauthorizedFromObject(user, [Config.types.private, Config.types.locked], []);

        if(!err && user != null)
        {
            var result = {
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