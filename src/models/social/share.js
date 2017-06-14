var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

function Share (object)
{
    Share.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/shares/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);
    /*self.ddr.numLikes = 0;*/

    self.rdf.type = "ddr:Share";

    return self;
    /*var descriptor = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:Post"
    });*/

    /*self.insertDescriptors([descriptor], function(err, result){
        return self;
    }, db_social.graphUri);*/

    /*var descriptorForPostType = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:Post"
    });

    var descriptorForShareType = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:Share"
    });

    self.insertDescriptors([descriptorForPostType, descriptorForShareType], function(err, result){
        self.copyOrInitDescriptors(object);
        self.ddr.numLikes = 0;
        return self;
    }, db_social.graphUri);*/
}

Share.buildFromInfo = function (info, callback) {
    var newShare = new this(info);
    callback(null, newShare);
};

Share = Class.extend(Share, Post);

module.exports.Share = Share;



