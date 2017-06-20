const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const uuid = require('uuid');

const db = function () {
    return GLOBAL.db.default;
}();
const db_social = function () {
    return GLOBAL.db.social;
}();

const gfs = function () {
    return GLOBAL.gfs.default;
}();
const async = require('async');

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

Notification = Class.extend(Notification, Resource);

module.exports.Notification = Notification;
