var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

function Progress (object)
{
    Progress.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "gm:Progress";

    return self;
}

Progress = Class.extend(Progress, Event);

module.exports.Progress = Progress;