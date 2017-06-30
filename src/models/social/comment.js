const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Comment (object)
{
    Comment.baseConstructor.call(this, object, Comment);
    let self = this;

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if(isNull(self.uri))
    {
        self.uri = "/r/comment/" + newId;
    }
    
    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/comments/" + newId;
    }

    return self;
}

Comment = Class.extend(Comment, Event, "ddr:Comment");

module.exports.Comment = Comment;


