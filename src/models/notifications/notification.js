const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const uuid = require("uuid");

function Notification (object)
{
    const self = this;
    self.addURIAndRDFType(object, "notification", Notification);
    Notification.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

// postURI/fileVersionUri
// postUriAuthor/fileVersionUriAuthor
// userWhoActed
// actionType -> Like, Comment, Share

// resourceTargetUri -> a post, fileVersion etc
// resourceAuthorUri -> the author of the post etc
// userWhoActed -> user who commmented/etc
// actionType -> comment/like/share
// status-> read/unread

Notification.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/notifications/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

Notification = Class.extend(Notification, Resource, "ddr:Notification");

module.exports.Notification = Notification;
