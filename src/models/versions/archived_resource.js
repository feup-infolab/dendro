const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Change = require(Pathfinder.absPathInSrcFolder("/models/versions/change.js")).Change;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const db = Config.getDBByID();

const _ = require("underscore");
const async = require("async");

function ArchivedResource (object)
{
    const self = this;
    self.addURIAndRDFType(object, "archived_resource", ArchivedResource);
    ArchivedResource.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    self.ddr.isVersionOf = object.ddr.isVersionOf;

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
    if(isNull(self.ddr.created))
    {
        self.ddr.created = now.toISOString();
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
            db.connection.executeViaJDBC(
                "SELECT ?archived_resource\n" +
                "FROM [0]\n"+
                "WHERE \n" +
                "{ \n" +
                "   ?archived_resource ddr:isVersionOf [1]. \n" +
                "   ?archived_resource ddr:versionNumber [2]. \n" +
                "} \n",

                [
                    {
                        type : Elements.types.resourceNoEscape,
                        value : graphUri
                    },
                    {
                        type : Elements.ontologies.ddr.isVersionOf.type,
                        value : resourceUri
                    },
                    {
                        type : Elements.ontologies.ddr.versionNumber.type,
                        value : versionNumber
                    }
                ],
                function(err, results) {
                    if(isNull(err))
                    {
                        if(results instanceof Array && results.length === 1)
                        {
                            ArchivedResource.findByUri(results[0].archived_resource, callback);
                        }
                        else
                        {
                            const msg = "Unable to determine the URI of the archived resource version " + versionNumber + " of " + resourceUri;
                            console.error(msg);
                            return callback(1, msg);
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
        if(isNull(err) && !isNull(archivedResource))
        {
            Change.findByAssociatedRevision(uri, function(err, changes)
            {
                if(isNull(err))
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
        if(isNull(err))
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

    const archivedResource = new ArchivedResource(JSON.parse(JSON.stringify(self)));
    archivedResource.changes = self.changes;

    const getAuthorInformation = function (cb) {
        const authorUri = self.ddr.versionCreator;
        User.findByUri(authorUri, function (err, fullVersionCreator) {
            if (isNull(err)) {
                Descriptor.removeUnauthorizedFromObject(fullVersionCreator, [Elements.access_types.private], [Elements.access_types.api_readable]);
                archivedResource.ddr.versionCreator = fullVersionCreator;
                return cb(null);
            }
            else
            {
                return cb(1);
            }
        });
    };

    const setHumanReadableDate = function (cb) {
        const moment = require('moment');
        const humanReadableDate = moment(archivedResource.ddr.created);

        archivedResource.ddr.created = humanReadableDate.calendar();
        return cb(null);
    };

    const getVersionedResourceDetail = function (cb) {
        Resource.findByUri(self.ddr.isVersionOf, function (err, versionedResource) {
            if (isNull(err)) {
                archivedResource.ddr.isVersionOf = versionedResource;
                return cb(null);
            }
            else {
                return cb(1);
            }
        })
    };

    const getDescriptorInformation = function (cb) {
        const fetchFullDescriptor = function (change, cb) {
            Descriptor.findByUri(change.ddr.changedDescriptor, function (err, descriptor) {
                if (isNull(err)) {
                    change.ddr.changedDescriptor = descriptor;
                    cb(null, change);
                }
                else {
                    cb(1, null);
                }
            });
        };

        if (!isNull(archivedResource.changes))
        {
            async.mapSeries(
                archivedResource.changes,
                fetchFullDescriptor,
                function (err, fullChanges) {
                    if (isNull(err)) {
                        archivedResource.changes = fullChanges;
                        Descriptor.removeUnauthorizedFromObject(archivedResource, [Elements.access_types.private], [Elements.access_types.api_readable]);
                        return cb(null);
                    }
                    else {
                        return cb(1, "Unable to fetch descriptor information. Reported Error: " + fullChanges);
                    }
                });
        }
        else {
            return cb(null);
        }
    };

    async.series([
        getAuthorInformation,
        setHumanReadableDate,
        getVersionedResourceDetail,
        getDescriptorInformation
    ],
    function(err, result)
    {
        return callback(err, archivedResource);
    });
};


ArchivedResource = Class.extend(ArchivedResource, Resource, "ddr:ArchivedResource");

module.exports.ArchivedResource = ArchivedResource;