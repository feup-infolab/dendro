const rlequire = require("rlequire");
const uuid = require("uuid");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Progress = rlequire("dendro", "src/models/notifications/progress.js").Progress;

const IO = rlequire("dendro", "src/bootup/models/io.js").IO;
const dbNotifications = Config.getDBByID("notifications");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

function Notification (object)
{
    const self = this;
    self.addURIAndRDFType(object, "notification", Notification);
    Notification.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

Notification.types = {
    PROGRESS: "ProgressMessage",
    FINISH_JOB: "FinishJob",
    SYSTEM: "SystemMessage"
};

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

Notification.sendSocketNotificationToUser = function (userUri, notificationObject)
{
    const userSession = IO.getUserSession(userUri);
    if (!isNull(userSession))
    {
        if (notificationObject.ddr.actionType === Notification.types.PROGRESS)
        {
            userSession.emitProgress(notificationObject);
        }
        else if (notificationObject.ddr.actionType === Notification.types.FINISH_JOB)
        {
            userSession.emitEnd(notificationObject);
        }
        else
        {
            userSession.emitNotification(notificationObject);
        }
    }
    else
    {
        Logger.log("error", "Could not emit message to user: " + userUri);
    }
};

Notification.startProgress = function (targetUserUri, message)
{
    const newJobProgress = new Progress(targetUserUri);
    Notification.sendProgress(message, newJobProgress);
    return newJobProgress;
};

Notification.sendProgress = function (message, progressReporter, referencedResource)
{
    if (isNull(progressReporter))
    {
        Logger.log("error", "Progress reporting notification called without a progress reporter object!");
    }
    else
    {
        const newNotification = Notification.buildFromSystemMessage(
            message,
            progressReporter.getUserURI(),
            referencedResource,
            Notification.types.PROGRESS
        );

        newNotification.ddr.taskID = progressReporter.getProgressID();
        progressReporter.touch();

        Notification.sendSocketNotificationToUser(progressReporter.getUserURI(), newNotification);
    }
};

Notification.finishProgress = function (progressReporter)
{
    const newNotification = Notification.buildFromSystemMessage(
        "Finished",
        progressReporter.getUserURI(),
        null,
        Notification.types.FINISH_JOB
    );

    newNotification.ddr.taskID = progressReporter.getProgressID();

    Notification.sendSocketNotificationToUser(progressReporter.getUserURI(), newNotification);
};

Notification.prototype.save = function (callback)
{
    const self = this;
    const notificationObject = JSON.parse(JSON.stringify(self));
    self.baseConstructor.prototype.save.call(self, function (err, result)
    {
        if (isNull(err))
        {
            Notification.sendSocketNotificationToUser(notificationObject.ddr.resourceAuthorUri, notificationObject);
        }
        callback(err, result);
    }, false, null, null, null, null, dbNotifications.graphUri);
};

Notification.buildFromSystemMessage = function (message, targetUserUri, referencedResource, actionType)
{
    let notificationType;
    if (isNull(actionType))
    {
        notificationType = Notification.types.SYSTEM;
    }
    else
    {
        notificationType = actionType;
    }

    const newNotification = new Notification({
        ddr: {
            actionType: notificationType,
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

    return newNotification;
};

Notification.buildAndSaveFromSystemMessage = function (message, targetUserUri, callback, referencedResource)
{
    const newNotification = Notification.buildFromSystemMessage(message, targetUserUri, callback, referencedResource);
    newNotification.save(function (err, info)
    {
        callback(err, info);
    });
};

Notification.buildAndSaveFromLike = function (currentUser, post, callback)
{
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
    newNotification.save(function (err, info)
    {
        callback(err, info);
    });
};

Notification.buildAndSaveFromShare = function (currentUser, post, newShare, callback)
{
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
    newNotification.save(function (err, info)
    {
        callback(err, info);
    });
};

Notification.buildAndSaveFromComment = function (currentUser, post, callback)
{
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
    newNotification.save(function (err, info)
    {
        callback(err, info);
    });
};

Notification = Class.extend(Notification, Resource, "ddr:Notification");

module.exports.Notification = Notification;
