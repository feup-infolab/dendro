const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
var Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require(Pathfinder.absPathInSrcFolder("/models/social/post.js")).Post;
var ArchivedResource = require(Pathfinder.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
var InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require("uuid");

const db = Config.getDBByID();
const db_social = Config.getDBByID("social");

var gfs = Config.getGFSByID();
var _ = require("underscore");
var async = require("async");

function ManualPost (object)
{
    /* ManualPost.baseConstructor.call(this, object);
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

    return self; */

    const self = this;
    // self.addURIAndRDFType(object, "post", Post);
    self.addURIAndRDFType(object, "post", ManualPost);
    ManualPost.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/posts/" + newId;
    }

    self.ddr.numLikes = 0;

    return self;
}

ManualPost.buildManualPost = function (userUri, project, postInfo, callback)
{
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

/*
ManualPost = Class.extend(ManualPost, Post);

module.exports.ManualPost = ManualPost; */

ManualPost = Class.extend(ManualPost, Post, "ddr:ManualPost");

module.exports.ManualPost = ManualPost;
