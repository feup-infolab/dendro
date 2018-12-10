const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;

const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Post = rlequire("dendro", "src/models/social/post.js").Post;
const uuid = require("uuid");

const db_social = Config.getDBByID("social");

const async = require("async");

function Share (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "share", Share);
    Share.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

Share.buildFromInfo = function (info, callback)
{
    let newShare = new this(info);
    callback(null, newShare);
};

Share.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/shares/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

Share = Class.extend(Share, Post, "ddr:Share");

module.exports.Share = Share;
