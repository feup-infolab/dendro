const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const uuid = require("uuid");
const IO = require(Pathfinder.absPathInSrcFolder("bootup/models/io.js")).IO;
const db_notifications = Config.getDBByID("notifications");
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

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

const sendSocketNotificationToUser = function (userUri, notificationObject)
{
    const userSession = IO.getUserSession(userUri);
    if(!isNull(userSession))
    {
        userSession.emitNotification(notificationObject);
    }
    else
    {
        Logger.log("error", "Could not emit message to user: " + userUri)
    }
};


Notification.prototype.save = function (callback) {
    const self = this;
    const notificationObject = JSON.parse(JSON.stringify(self));
    self.baseConstructor.prototype.save.call(self, function (err, result)
    {
        if(isNull(err))
        {
            sendSocketNotificationToUser(notificationObject.ddr.resourceAuthorUri, notificationObject);
        }
        callback(err, result);
    }, false, null, null, null, null, db_notifications.graphUri);
};


Notification.buildAndSaveFromSystemMessage = function (message, targetUserUri, callback, referencedResource) {
    const newNotification = new Notification({
        ddr: {
            actionType: "SystemMessage",
            resourceAuthorUri: targetUserUri,
            resourceTargetUri: referencedResource
        },
        foaf: {
            status: "unread"
        },
        schema: {
            sharedContent: message
        }
    });
    newNotification.save(function (err, info) {
        callback(err, info);
    });
};

Notification.buildAndSaveFromLike = function (currentUser, post, callback) {
    // resourceTargetUri -> a post etc
    // resourceAuthorUri -> the author of the post etc
    // userWhoActed -> user who commmented/etc
    // actionType -> comment/like/share
    // status-> read/unread
    const newNotification = new Notification({
        ddr: {
            userWhoActed: currentUser.uri,
            resourceTargetUri: post.uri,
            actionType: "Like",
            resourceAuthorUri: post.dcterms.creator
        },
        foaf: {
            status: "unread"
        }
    });
    newNotification.save(function (err, info) {
        callback(err, info);
    });
};

Notification.buildAndSaveFromShare = function (currentUser, post, newShare, callback) {
    const newNotification = new Notification({
        ddr: {
            userWhoActed: currentUser.uri,
            resourceTargetUri: post.uri,
            actionType: "Share",
            resourceAuthorUri: post.dcterms.creator,
            shareURI: newShare.uri
        },
        foaf: {
            status: "unread"
        }
    });
    newNotification.save(function (err, info) {
        callback(err, info);
    });
};

Notification.buildAndSaveFromComment = function (currentUser, post, callback) {
    const newNotification = new Notification({
        ddr: {
            userWhoActed: currentUser.uri,
            resourceTargetUri: post.uri,
            actionType: "Comment",
            resourceAuthorUri: post.dcterms.creator
        },
        foaf: {
            status: "unread"
        }
    });
    newNotification.save(function (err, info) {
        callback(err, info);
    });
};

Notification = Class.extend(Notification, Resource, "ddr:Notification");

module.exports.Notification = Notification;
