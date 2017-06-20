const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const uuid = require('uuid');

function Notification (object)
{
    Notification.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Notification";

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
