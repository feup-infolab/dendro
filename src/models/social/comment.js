const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Event = rlequire("dendro", "src/models/social/event.js").Event;
const uuid = require("uuid");

function Comment (object = {})
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
