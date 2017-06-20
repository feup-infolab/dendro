const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Comment (object)
{
    Comment.baseConstructor.call(this, object);
    let self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Comment";

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

Comment = Class.extend(Comment, Event);

module.exports.Comment = Comment;


