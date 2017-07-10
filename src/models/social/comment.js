const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
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


