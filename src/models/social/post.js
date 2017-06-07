var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

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

    self.ddr.numLikes = 0;

    return self;
}

Post.buildFromArchivedVersion = function (archivedVersion) {
    //CREATE A POST FOR EACH ARCHIVED VERSION CHANGE
    //DONT SAVE IT HERE
};

Post.buildFromMkdirOperation = function (mkdirOperation) {
    //CREATE A POST FOR EACH MKDIR OPERATION
    //DONT SAVE IT HERE
};

Post.buildFromRmdirOperation = function (rmdirOperation) {
    //CREATE A POST FOR EACH RMDIR OPERATION
    //DONT SAVE IT HERE
};

Post.buildManualPost = function (postContent) {
    //CREATE A POST WITH MANUAL CONTENT
    //DONT SAVE IT HERE
};

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


