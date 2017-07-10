const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const uuid = require('uuid');

function Notification (object)
{
    Notification.baseConstructor.call(this, object, Notification);
    const self = this;

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if(isNull(self.uri))
    {
        self.uri = "/r/notification" + newId;
    }

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/notifications/" + newId;
    }

    return self;
}

//postURI/fileVersionUri
//postUriAuthor/fileVersionUriAuthor
//userWhoActed
//actionType -> Like, Comment, Share

Notification = Class.extend(Notification, Resource);

module.exports.Notification = Notification;
