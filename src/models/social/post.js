const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Post (object)
{
    Post.baseConstructor.call(this, object, Post);
    const self = this;

    self.copyOrInitDescriptors(object);

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

Post = Class.extend(Post, Event, "ddr:Post");

module.exports.Post = Post;


