const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Event = rlequire("dendro", "src/models/social/event.js").Event;
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
