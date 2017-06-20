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

    if(!isNull(object.uri))
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/notifications/" + uuid.v4();
    }

    return self;
}

//postURI/fileVersionUri
//postUriAuthor/fileVersionUriAuthor
//userWhoActed
//actionType -> Like, Comment, Share

//resourceTargetUri -> a post, fileVersion etc
//resourceAuthorUri -> the author of the post etc
//userWhoActed -> user who commmented/etc
//actionType -> comment/like/share
//status-> read/unread

Notification = Class.extend(Notification, Resource);

module.exports.Notification = Notification;
