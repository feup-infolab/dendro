const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Post (object)
{
    Post.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Post";

    const newId = uuid.v4();

    if(isNull(self.uri))
    {
        self.uri = "/r/post/" + newId;
    }

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/posts/" + newId;
    }




    self.ddr.numLikes = 0;

    return self;
}

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


