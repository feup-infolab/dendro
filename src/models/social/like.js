const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
const uuid = require("uuid");

function Like (object)
{
    const self = this;
    self.addURIAndRDFType(object, "like", Like);
    Like.baseConstructor.call(this, object);
    self.copyOrInitDescriptors(object);
    return self;
}

Like.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/likes/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

Like = Class.extend(Like, Event, "ddr:Like");

module.exports.Like = Like;
