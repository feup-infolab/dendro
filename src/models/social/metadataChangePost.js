const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
var Class = rlequire("dendro", "src/models/meta/class.js").Class;
var Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
var Post = rlequire("dendro", "src/models/social/post.js").Post;
const User = rlequire("dendro", "src/models/user.js").User;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
var ArchivedResource = rlequire("dendro", "src/models/versions/archived_resource.js").ArchivedResource;
var DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
var uuid = require("uuid");

const db = Config.getDBByID();
const db_social = Config.getDBByID("social");

var gfs = Config.getGFSByID();
var _ = require("underscore");
var async = require("async");

function MetadataChangePost (object)
{
    const self = this;
    self.addURIAndRDFType(object, "post", MetadataChangePost);
    MetadataChangePost.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    return self;
}

MetadataChangePost.buildFromArchivedVersion = function (archivedVersion, project, callback)
{
    var changeAuthor = archivedVersion.ddr.versionCreator;
    User.findByUri(changeAuthor, function (err, fullVersionCreator)
    {
        if (isNull(err))
        {
            var title = fullVersionCreator.ddr.username + " worked on " + archivedVersion.changes.length + " metadata changes";
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
        }
        else
        {
            const msg = "Error building a MetadataChangePost from an ArchivedVersion: " + JSON.stringify(fullVersionCreator);
            Logger.log("error", msg);
            callback(err, fullVersionCreator);
        }
    });
};

MetadataChangePost.prototype.getChangesFromMetadataChangePost = function (cb)
{
    var self = this;
    let archivedVersionUri = self.schema.sharedContent;

    const getDescriptorPrefixedForm = function (descriptorUri, callback)
    {
        Descriptor.findByUri(descriptorUri, function (err, descriptor)
        {
            if (isNull(err))
            {
                callback(err, descriptor.prefixedForm);
            }
            else
            {
                const msg = "Error getting the prefixedForm for descriptor: " + descriptorUri;
                Logger.log("error", msg);
                callback(err, descriptor);
            }
        });
    };

    ArchivedResource.findByUri(archivedVersionUri, function (err, archivedVersion)
    {
        if (!err)
        {
            /* let numberOfChanges = archivedVersion.changes.length;
            let changesSortedByType = _.groupBy(archivedVersion.changes, function(change){ return change.ddr.changeType;});
            let hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
            let hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
            let hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
            let editChanges, addChanges, deleteChanges;
            let isVersionOf = archivedVersion.ddr.isVersionOf; */

            async.mapSeries(archivedVersion.changes, function (change, callback)
            {
                getDescriptorPrefixedForm(change.ddr.changedDescriptor, function (err, prefixedForm)
                {
                    if (isNull(err))
                    {
                        if (!isNull(prefixedForm))
                        {
                            change.prefixedForm = prefixedForm;
                            callback(err, change);
                        }
                        else
                        {
                            const msg = "[Error] could not find prefixed form for descriptor : " + change.ddr.changedDescriptor;
                            callback(true, msg);
                        }
                    }
                    else
                    {
                        callback(err, change);
                    }
                });
            }, function (err, result)
            {
                if (isNull(err))
                {
                    let numberOfChanges = archivedVersion.changes.length;
                    let changesSortedByType = _.groupBy(archivedVersion.changes, function (change)
                    {
                        return change.ddr.changeType;
                    });
                    let hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
                    let hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
                    let hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
                    let editChanges, addChanges, deleteChanges;
                    let isVersionOf = archivedVersion.ddr.isVersionOf;
                    Resource.findByUri(isVersionOf, function (err, resource)
                    {
                        if (isNull(err))
                        {
                            if (!isNull(resource))
                            {
                                try
                                {
                                    editChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsDeleted > 0 ? changesSortedByType.edit.splice(0, 1) : changesSortedByType.edit.splice(0, 3);
                                }
                                catch (err)
                                {
                                    editChanges = null;
                                }

                                try
                                {
                                    addChanges = hasNumberOfDescriptorsEdited + hasNumberOfDescriptorsDeleted > 0 ? changesSortedByType.add.splice(0, 1) : changesSortedByType.add.splice(0, 3);
                                }
                                catch (err)
                                {
                                    addChanges = null;
                                }

                                try
                                {
                                    deleteChanges = hasNumberOfDescriptorsAdded + hasNumberOfDescriptorsEdited > 0 ? changesSortedByType.delete.splice(0, 1) : changesSortedByType.delete.splice(0, 3);
                                }
                                catch (err)
                                {
                                    deleteChanges = null;
                                }

                                let changesInfo = {
                                    editChanges: editChanges,
                                    addChanges: addChanges,
                                    deleteChanges: deleteChanges,
                                    numberOfChanges: numberOfChanges,
                                    hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,
                                    hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,
                                    hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted,
                                    isVersionOf: resource
                                };

                                cb(err, changesInfo);
                            }
                            else
                            {
                                const msg = "Resource at getChangesFromMetadataChangePost resource does not exist";
                                Logger.log("error", msg);
                                cb(true, msg);
                            }
                        }
                        else
                        {
                            Logger.log("error", "Error Looking for the resource at getChangesFromMetadataChangePost Error: " + JSON.stringify(resource));
                            cb(err, archivedVersion);
                        }
                    });
                }
                else
                {
                    Logger.log("error", "Error Looking for prefixedResource at getChangesFromMetadataChangePost Error: " + result);
                    cb(err, result);
                }
            });
        }
        else
        {
            Logger.log("error", "Error at getChangesFromMetadataChangePost:");
            Logger.log("error", err);
            cb(err, archivedVersion);
        }
    });
};

MetadataChangePost.prototype.getHumanReadableUri = function (callback)
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

MetadataChangePost = Class.extend(MetadataChangePost, Post, "ddr:MetadataChangePost");

module.exports.MetadataChangePost = MetadataChangePost;
