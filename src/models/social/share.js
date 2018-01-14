const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Post = require(Pathfinder.absPathInSrcFolder("/models/social/post.js")).Post;
const uuid = require("uuid");

const db_social = Config.getDBByID("social");

const async = require("async");

function Share (object)
{
    const self = this;
    self.addURIAndRDFType(object, "share", Share);
    Share.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = "/shares/" + newId;
    }

    return self;
}

Share.buildFromInfo = function (info, callback)
{
    let newShare = new this(info);
    callback(null, newShare);
};

Share = Class.extend(Share, Post, "ddr:Share");

module.exports.Share = Share;
