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

    const newId = uuid.v4();

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/notifications/" + newId;
    }

    return self;
}

// postURI/fileVersionUri
// postUriAuthor/fileVersionUriAuthor
// userWhoActed
// actionType -> Like, Comment, Share

Notification = Class.extend(Notification, Resource, "ddr:Notification");

module.exports.Notification = Notification;
