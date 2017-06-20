const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require('uuid');

function Like (object)
{
    Like.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Like";

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

Like = Class.extend(Like, Event);

module.exports.Like = Like;
