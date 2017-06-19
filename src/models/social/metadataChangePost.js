var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

function MetadataChangePost (object)
{
    MetadataChangePost.baseConstructor.call(this, object);
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

    self.rdf.type = "ddr:MetadataChangePost";

    return self;
}

MetadataChangePost.buildFromArchivedVersion = function (archivedVersion, project, callback) {
    var changeAuthor = archivedVersion.ddr.versionCreator;
    var title = changeAuthor.split("/").pop() + " worked on "  + archivedVersion.changes.length +" metadata changes";
    var versionUri = archivedVersion.uri;
    var newMetadataChangePost = new MetadataChangePost({
        ddr: {
            projectUri: project.uri
        },
        dcterms: {
            creator: changeAuthor,
            title: title
        },
        schema: {
            sharedContent: versionUri
        }
    });
    callback(null, newMetadataChangePost);
};

MetadataChangePost.prototype.getChangesFromMetadataChangePost = function (cb) {
    var self = this;
    let archivedVersionUri = self.schema.sharedContent;

    ArchivedResource.findByUri(archivedVersionUri, function (err, archivedVersion) {
        if(!err)
        {
            let numberOfChanges = archivedVersion.changes.length;
            let changesSortedByType = _.groupBy(archivedVersion.changes, function(change){ return change.ddr.changeType;});
            let hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
            let hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
            let hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
            let editChanges, addChanges, deleteChanges;

            try {
                editChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsDeleted  > 0 ? changesSortedByType.edit.splice(0, 1) : changesSortedByType.edit.splice(0, 3);
            }
            catch(err) {
                editChanges = null;
            }

            try {
                addChanges = hasNumberOfDescriptorsEdited + hasNumberOfDescriptorsDeleted  > 0 ? changesSortedByType.add.splice(0, 1) : changesSortedByType.add.splice(0, 3);
            }
            catch(err) {
                addChanges = null;
            }

            try {
                deleteChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsEdited  > 0 ? changesSortedByType.delete.splice(0,1) : changesSortedByType.delete.splice(0,3)
            }
            catch(err) {
                deleteChanges = null;
            }

            let changesInfo = {
                editChanges : editChanges,
                addChanges: addChanges,
                deleteChanges: deleteChanges,
                numberOfChanges: numberOfChanges,
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted
            };

            cb(err, changesInfo);
        }
        else
        {
            console.error("Error at getChangesFromMetadataChangePost:");
            console.error(err);
            cb(err, archivedVersion);
        }
    });
};

/*MetadataChangePost.prefixedRDFType = "ddr:MetadataChangePost";*/

MetadataChangePost = Class.extend(MetadataChangePost, Post);

module.exports.MetadataChangePost = MetadataChangePost;



