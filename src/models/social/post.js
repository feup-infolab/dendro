var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
var uuid = require('node-uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');

function Post (object)
{
    Post.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/posts/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Post";

    return self;
}

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


