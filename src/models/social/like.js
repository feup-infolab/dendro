const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
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
        self.ddr.humanReadableURI = Config.baseUri + "/likes/" + newId;
    }

    return self;
}

Like = Class.extend(Like, Event, "ddr:Like");

module.exports.Like = Like;
