const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Like (object)
{
    Like.baseConstructor.call(this, object, Like);
    const self = this;

    self.copyOrInitDescriptors(object);

    //self.dcterms.postURI = "";

    const newId = uuid.v4();
    
    if(isNull(self.uri))
    {
        self.uri = "/r/like/" + newId;
    }

    if(isNull(self.ddr.humanReadableURI))
    {
        self.uri = Config.baseUri + "/likes/" + newId;
    }

    return self;
}

Like = Class.extend(Like, Event, "ddr:Like");

module.exports.Like = Like;
