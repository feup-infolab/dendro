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

    /*self.ddr.numLikes = 0;*/

    return self;

    /*var descriptor = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:Post"
    });*/

    /*var descriptorForPostType = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:Post"
    });

    var descriptorForMetadataChangePostType = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        value : "ddr:MetadataChangePost"
    });*/

    /*self.insertDescriptors([descriptor], function(err, result){
        return self;
    }, db_social.graphUri);*/

    /*self.insertDescriptors([descriptorForPostType, descriptorForMetadataChangePostType], function(err, result){
        return self;
    }, db_social.graphUri);*/
}

MetadataChangePost.buildFromArchivedVersion = function (archivedVersion, project, callback) {
    //CREATE A POST FOR EACH ARCHIVED VERSION CHANGE
    //DON'T SAVE IT HERE
    /*var changeAuthor = archivedVersion.ddr.versionCreator;
    var numberOfChanges = archivedVersion.changes.length;
    var changesSortedByType = _.groupBy(archivedVersion.changes, function(change){ return change.ddr.changeType;});
    var hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
    var hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
    var hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
    var title = changeAuthor.split("/").pop() + " worked on " + numberOfChanges + " metadata changes";
    var versionUri = archivedVersion.uri;*/

   /* async.map(changesSortedByType, function(changeType, callback)
    {
        var change = {
            ddr : {
                changedDescriptor: changeType[0].ddr.changedDescriptor,
                newValue: changeType[0].ddr.newValue,
                changeType: changeType[0].ddr.changeType,
                pertainsTo: changeType[0].ddr.pertainsTo,
                changeIndex: changeType[0].ddr.changeIndex,
                oldValue: changeType[0].ddr.oldValue
            }
        };
        //callback(null, changeType[0]);
        callback(null, change);
    }, function(err, results){
        //Add to the post the number of changes added, edited, deleted
        //the number of changes total
        //the version uri for the full details
        //TODO MAYBE ADD THE URI OF THE RESOURCE????
        var newMetadataChangePost = new MetadataChangePost({
            ddr: {
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,//TODO adicionar isto ao elements.js
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,//TODO adicionar isto ao elements.js
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted,//TODO adicionar isto ao elements.js
                hasNumberOfChanges : numberOfChanges,//TODO adicionar isto ao elements.js
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
    });*/


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

    //TODO
    //GET THE ARCHIVED VERSION by self.schema.sharedContent
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
                editChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsDeleted  > 1 ? changesSortedByType.edit.splice(0, 1) : changesSortedByType.edit.splice(0, 3);
            }
            catch(err) {
                editChanges = null;
            }

            try {
                addChanges = hasNumberOfDescriptorsEdited + hasNumberOfDescriptorsDeleted  > 1 ? changesSortedByType.add.splice(0, 1) : changesSortedByType.add.splice(0, 3);
            }
            catch(err) {
                addChanges = null;
            }

            try {
                deleteChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsEdited  > 1 ? changesSortedByType.delete.splice(0,1) : changesSortedByType.delete.splice(0,3)
            }
            catch(err) {
                deleteChanges = null;
            }
            /*var editChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsDeleted  > 1 ? changesSortedByType.edit.splice(0, 1) : changesSortedByType.edit.splice(0, 3);
            var addChanges = hasNumberOfDescriptorsEdited + hasNumberOfDescriptorsDeleted  > 1 ? changesSortedByType.add.splice(0, 1) : changesSortedByType.edit.splice(0, 3);
            var deleteChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsEdited  > 1 ? changesSortedByType.delete.splice(0, 1) : changesSortedByType.edit.splice(0, 3);*/

            let changesInfo = {
                editChanges : editChanges,
                addChanges: addChanges,
                deleteChanges: deleteChanges,
                numberOfChanges: numberOfChanges,
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted
            }

            cb(err, changesInfo);
        }
        else
        {
            console.error("Error at getChangesFromMetadataChangePost:");
            console.error(err);
            cb(err, archivedVersion);
        }
    });

    /*

    async.map(changesSortedByType, function(changeType, callback)
    {
        var change = {
            ddr : {
                changedDescriptor: changeType[0].ddr.changedDescriptor,
                newValue: changeType[0].ddr.newValue,
                changeType: changeType[0].ddr.changeType,
                pertainsTo: changeType[0].ddr.pertainsTo,
                changeIndex: changeType[0].ddr.changeIndex,
                oldValue: changeType[0].ddr.oldValue
            }
        };
        //callback(null, changeType[0]);
        callback(null, change);
    }, function(err, results){
        //Add to the post the number of changes added, edited, deleted
        //the number of changes total
        //the version uri for the full details
        //TODO MAYBE ADD THE URI OF THE RESOURCE????
        var newMetadataChangePost = new MetadataChangePost({
            ddr: {
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,//TODO adicionar isto ao elements.js
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,//TODO adicionar isto ao elements.js
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted,//TODO adicionar isto ao elements.js
                hasNumberOfChanges : numberOfChanges,//TODO adicionar isto ao elements.js
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
    });*/
};

/*MetadataChangePost.prefixedRDFType = "ddr:MetadataChangePost";*/

MetadataChangePost = Class.extend(MetadataChangePost, Post);

module.exports.MetadataChangePost = MetadataChangePost;



