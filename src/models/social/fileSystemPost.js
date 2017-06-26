var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

function FileSystemPost (object)
{
    FileSystemPost.baseConstructor.call(this, object);
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

    self.rdf.type = "ddr:FileSystemPost";

    return self;
}

FileSystemPost.buildFromRmdirOperation = function (userUri, project, folder, reallyDelete, callback) {
    let title = userUri.split("/").pop() + " deleted folder " + folder.nie.title;
    let newPost = new FileSystemPost({
        ddr: {
            projectUri: project.uri,
            changeType: "rmdir",
            deleted: reallyDelete
        },
        dcterms: {
            creator: userUri,
            title: title
        },
        schema: {
            sharedContent: folder.uri
        }
    });
    callback(null, newPost);
};

FileSystemPost.buildFromMkdirOperation = function (userUri, project, folder, callback) {
    let title = userUri.split("/").pop() + " created folder " + folder.nie.title;
    let newPost = new FileSystemPost({
        ddr: {
            projectUri: project.uri,
            changeType: "mkdir"
        },
        dcterms: {
            creator: userUri,
            title: title
        },
        schema: {
            sharedContent: folder.uri
        }
    });
    callback(null, newPost);
};

FileSystemPost.buildFromUpload = function (userUri, projectUri, file, callback) {
    let title = userUri.split("/").pop() + " uploaded file " + file.filename.split("/").pop();
    let newPost = new FileSystemPost({
        ddr: {
            projectUri: projectUri,
            changeType: "upload"
        },
        dcterms: {
            creator: userUri,
            title: title
        },
        schema: {
            sharedContent: file.filename
        }
    });
    callback(null, newPost);
};


FileSystemPost.buildFromDeleteFile = function (userUri, projectUri, file, callback) {
    //introduzir really delete
    let title = userUri.split("/").pop() + " deleted file " + file.nie.title;
    let newPost = new FileSystemPost({
        ddr: {
            projectUri: projectUri,
            changeType: "delete"
        },
        dcterms: {
            creator: userUri,
            title: title
        },
        schema: {
            sharedContent: file.uri
        }
    });
    callback(null, newPost);
};


FileSystemPost.prototype.getResourceInfo = function (callback) {
    var self = this;
    let resourceUri = self.schema.sharedContent;

    //InformationElement.findByUri(resourceUri, function (err, resource) {
    //TODO para alguns casos, os ficheiros não estão a ser encontrados, só estão a ser encontrados txts
    InformationElement.findByUri(resourceUri, function (err, resource) {
        if(!err && resource)
        {
            if(!resource.metadataQuality)
            {
                resource.metadataQuality = 0;
            }
            callback(err, resource);
        }
        else
        {
            console.error("Error getting resource info from a FileSystemPost");
            console.error(resource);
            callback(err, resource);
        }
    }, null, db.graphUri, false, null, null);
};


/*FileSystemPost.prefixedRDFType = "ddr:FileSystemPost";*/

FileSystemPost = Class.extend(FileSystemPost, Post);

module.exports.FileSystemPost = FileSystemPost;




