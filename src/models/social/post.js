const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
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

function Post (object)
{
    Post.baseConstructor.call(this, object);
    const self = this;

    if(!isNull(object.uri))
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/posts/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Post";

    self.ddr.numLikes = 0;

    return self;
}

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


