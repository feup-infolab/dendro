const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require("uuid");

function Comment (object)
{
    const self = this;
    self.addURIAndRDFType(object, "comment", Comment);
    Comment.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    return self;
}

Comment.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/comments/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

Comment = Class.extend(Comment, Event, "ddr:Comment");

module.exports.Comment = Comment;
