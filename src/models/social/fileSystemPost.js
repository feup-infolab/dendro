const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
var Class = rlequire("dendro", "src/models/meta/class.js").Class;
var Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
var Post = rlequire("dendro", "src/models/social/post.js").Post;
const User = rlequire("dendro", "src/models/user.js").User;
var ArchivedResource = rlequire("dendro", "src/models/versions/archived_resource.js").ArchivedResource;
var InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
var Resource = rlequire("dendro", "src/models/resource.js").Resource;
var DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
var uuid = require("uuid");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const db = Config.getDBByID();
const db_social = Config.getDBByID("social");

var gfs = Config.getGFSByID();
var _ = require("underscore");
var async = require("async");

function FileSystemPost (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "post", FileSystemPost);
    FileSystemPost.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    return self;
}

FileSystemPost.buildFromRmdirOperation = function (userUri, project, folder, reallyDelete, callback)
{
    User.findByUri(userUri, function (err, creator)
    {
        if (isNull(err))
        {
            let title = creator.ddr.username + " deleted folder " + folder.nie.title;
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
        }
        else
        {
            const msg = "Error building a FileSystemPost from an rmdir operation: " + JSON.stringify(creator);
            Logger.log("error", msg);
            callback(err, creator);
        }
    });
};

FileSystemPost.buildFromMkdirOperation = function (userUri, project, folder, callback)
{
    User.findByUri(userUri, function (err, creator)
    {
        if (isNull(err))
        {
            let title = creator.ddr.username + " created folder " + folder.nie.title;
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
        }
        else
        {
            const msg = "Error building a FileSystemPost from an mkdir operation: " + JSON.stringify(creator);
            Logger.log("error", msg);
            callback(err, creator);
        }
    });
};

FileSystemPost.buildFromUpload = function (userUri, project, file, callback)
{
    User.findByUri(userUri, function (err, creator)
    {
        if (isNull(err))
        {
            let title = creator.ddr.username + " uploaded file " + file.nie.title;
            let newPost = new FileSystemPost({
                ddr: {
                    projectUri: project.uri,
                    changeType: "upload"
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
        }
        else
        {
            const msg = "Error building a FileSystemPost from an upload operation: " + JSON.stringify(creator);
            Logger.log("error", msg);
            callback(err, creator);
        }
    });
};

FileSystemPost.buildFromDeleteFile = function (userUri, projectUri, file, callback)
{
    // introduzir really delete
    User.findByUri(userUri, function (err, creator)
    {
        if (isNull(err))
        {
            let title = creator.ddr.username + " deleted file " + file.nie.title;
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
        }
        else
        {
            const msg = "Error building a FileSystemPost from a delete file operation: " + JSON.stringify(creator);
            Logger.log("error", msg);
            callback(err, creator);
        }
    });
};

FileSystemPost.prototype.getResourceInfo = function (callback)
{
    var self = this;
    let resourceUri = self.schema.sharedContent;

    // InformationElement.findByUri(resourceUri, function (err, resource) {
    // TODO para alguns casos, os ficheiros não estão a ser encontrados, só estão a ser encontrados txts
    InformationElement.findByUri(resourceUri, function (err, resource)
    {
        if (!err && resource)
        {
            if (!resource.metadataQuality)
            {
                resource.metadataQuality = 0;
            }
            callback(err, resource);
        }
        else
        {
            Logger.log("warn", "Error getting resource info from a FileSystemPost");
            Logger.log("warn", resource);
            callback(err, resource);
        }
    }, null, db.graphUri, false, null, null);
};

FileSystemPost.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/posts/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

/* FileSystemPost = Class.extend(FileSystemPost, Post); */
FileSystemPost = Class.extend(FileSystemPost, Post, "ddr:FileSystemPost");

module.exports.FileSystemPost = FileSystemPost;
