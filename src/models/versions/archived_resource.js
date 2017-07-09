const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Elements = require(Config.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const db = function () {
    return global.db.default;
}();

const _ = require('underscore');
const async = require('async');

function ArchivedResource (object)
{
    ArchivedResource.baseConstructor.call(this, object, ArchivedResource);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.ddr.isVersionOf = object.ddr.isVersionOf;

    if(isNull(self.uri))
    {
        const uuid = require('uuid');
        self.uri = "/r/archived_resource/" + uuid.v4();
    }

    if(isNull(self.ddr.humanReadableURI))
    {
        self.humanReadableURI = object.ddr.humanReadableURI + "/version/" + object.ddr.newVersionNumber;
    }

    if(!isNull(object.rdf.type))
    {
        if(object.rdf.type instanceof Array)
        {
            if(!_.contains(object.rdf.type, "ddr:ArchivedResource"))
            {
                self.rdf.type = object.rdf.type.concat(["ddr:ArchivedResource"]);
            }
        }
        else if (typeof object.rdf.type === "string")
        {
            if(object.rdf.type !== "ddr:ArchivedResource")
            {
                self.rdf.type = [object.rdf.type, "ddr:ArchivedResource"];
            }
        }
    }

    const now = new Date();
    if(isNull(object.dcterms) || isNull(object.dcterms.created))
    {
        self.dcterms.created = now.toISOString();
    }

    return self;
}

ArchivedResource.findByResourceAndVersionNumber = function(resourceUri, versionNumber, callback, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    try
    {
        if(!isNull(versionNumber) && typeof versionNumber === 'number' && versionNumber%1 === 0)
        {
            db.connection.execute(
                "SELECT ?archived_resource\n" +
                "FROM [0]\n"+
                "WHERE \n" +
                "{ \n" +
                "   ?archived_resource ddr:isVersionOf [1]. \n" +
                "   ?archived_resource ddr:versionNumber [2]. \n" +
                "} \n",

                [
                    {
                        type : DbConnection.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : Elements.ddr.isVersionOf.type,
                        value : resourceUri
                    },
                    {
                        type : Elements.ddr.versionNumber.type,
                        value : versionNumber
                    }
                ],
                function(err, results) {
                    if(!err)
                    {
                        if(results instanceof Array && results.length === 1)
                        {
                            ArchivedResource.findByUri(results[0].archived_resource, callback);
                        }
                        else
                        {
                            return callback(1, "Unable to determine the URI of the archived resource version " + versionNumber + " of " + resourceUri);
                        }
                    }
                    else
                    {
                        const msg = "Error finding archived version " + versionNumber + " of resource " + resourceUri + " . Error returned: " + JSON.stringify(results);
                        console.error(msg);
                        return callback(err, msg);
                    }
                });
        }
        else
        {
            return callback(1, versionNumber + " is not a valid integer.");
        }
    }
    catch(ex)
    {
        return callback(1, versionNumber + " is not a valid integer. Exception reported : "  + ex);
    }
};

ArchivedResource.findByUri = function(uri, callback)
{
    ArchivedResource.baseConstructor.findByUri(uri, function(err, archivedResource)
    {
        if(!err && !isNull(archivedResource))
        {
            Change.findByAssociatedRevision(uri, function(err, changes)
            {
                if(!err)
                {
                    archivedResource = new ArchivedResource(JSON.parse(JSON.stringify(archivedResource)));
                    archivedResource.changes = changes;
                    return callback(null, archivedResource);
                }
                else
                {
                    return callback(1, archivedResource);
                }
            });
        }
        else
        {
            const error = "Unable to find archived resource with uri : " + uri;
            console.error(error);
            return callback(1, null);
        }
    });
};

ArchivedResource.prototype.getChanges = function(callback)
{
    const self = this;
    Change.findByAssociatedRevision(self.uri, function(err, changes)
    {
        if(!err)
        {
            return callback(null, changes);
        }
        else
        {
            return callback(1, changes);
        }

    })
};

ArchivedResource.prototype.getDetailedInformation = function(callback)
{
    const self = this;

    const authorUri = self.ddr.versionCreator;

    const archivedResource = new ArchivedResource(JSON.parse(JSON.stringify(self)));
    archivedResource.changes = self.changes;

    const getAuthorInformation = function (callback) {
        User.findByUri(authorUri, function (err, fullVersionCreator) {
            if (!err) {
                Descriptor.removeUnauthorizedFromObject(fullVersionCreator, [Config.types.private], [Config.types.api_readable]);
                archivedResource.ddr.versionCreator = fullVersionCreator;
                return callback(null);
            }
            else {
                return callback(1);
            }
        });
    };

    const setHumanReadableDate = function (callback) {
        const moment = require('moment');
        const humanReadableDate = moment(archivedResource.dcterms.created);

        archivedResource.dcterms.created = humanReadableDate.calendar();
        return callback(null);
    };

    const getDescriptorInformation = function (callback) {
        const fetchFullDescriptor = function (change, cb) {
            Descriptor.findByUri(change.ddr.changedDescriptor, function (err, descriptor) {
                if (!err) {
                    change.ddr.changedDescriptor = descriptor;
                    cb(null, change);
                }
                else {
                    cb(1, null);
                }
            });
        };

        if (!isNull(archivedResource.changes)) {
            async.map(archivedResource.changes, fetchFullDescriptor, function (err, fullChanges) {
                if (!err) {
                    archivedResource.changes = fullChanges;
                    Descriptor.removeUnauthorizedFromObject(archivedResource, [Config.types.private], [Config.types.api_readable]);
                    return callback(0);
                }
                else {
                    return callback(1, "Unable to fetch descriptor information. Reported Error: " + fullChanges);
                }
            });
        }
        else {
            return callback(0);
        }
    };

    const getVersionedResourceDetail = function (callback) {
        Resource.findByUri(self.ddr.isVersionOf, function (err, versionedResource) {
            if (!err) {
                archivedResource.ddr.isVersionOf = versionedResource;
                return callback(null);
            }
            else {
                return callback(1);
            }
        })
    };

    async.series([
        getAuthorInformation,
        setHumanReadableDate,
        getDescriptorInformation,
        getVersionedResourceDetail
    ],
    function(err, result)
    {
        return callback(err, archivedResource);
    });
};


ArchivedResource = Class.extend(ArchivedResource, Resource, "ddr:ArchivedResource");

module.exports.ArchivedResource = ArchivedResource;