var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

function ManualPost (object)
{
    ManualPost.baseConstructor.call(this, object);
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

    self.rdf.type = "ddr:ManualPost";

    return self;
}

ManualPost.buildManualPost = function (userUri, project, postInfo, callback) {
    let newPost = new ManualPost({
        ddr: {
            projectUri: project.uri
        },
        dcterms: {
            creator: userUri,
            title: postInfo.title
        },
        schema: {
            sharedContent: postInfo.body
        }
    });
    callback(null, newPost);
};


/*ManualPost.prefixedRDFType = "ddr:ManualPost";*/

ManualPost = Class.extend(ManualPost, Post);

module.exports.ManualPost = ManualPost;