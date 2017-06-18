const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

const _ = require('underscore');
const async = require('async');

function ArchivedResource (object)
{
    ArchivedResource.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    if(!isNull(object.rdf.type))
    {
        if(object.rdf.type instanceof Array)
        {
            self.rdf.type.push("ddr:ArchivedResource");
        }
        else
        {
            self.rdf.type = [self.rdf.type, "ddr:ArchivedResource"];
        }
    }
    else
    {
        self.rdf.type = "ddr:ArchivedResource";
    }

    const now = new Date();
    if(isNull(object.dcterms.created))
    {
        self.dcterms.created = now.toISOString();
    }

    return self;
}

ArchivedResource.findByResourceAndVersionNumber = function(resourceUri, versionNumber, callback)
{
    try
    {
        versionNumber = parseInt(versionNumber);

        if(!isNull(versionNumber) && typeof versionNumber === 'number' && versionNumber%1 === 0)
        {
            const archivedVersionUri = resourceUri + "/version/" + versionNumber;

            ArchivedResource.findByUri(archivedVersionUri, callback);
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

ArchivedResource = Class.extend(ArchivedResource, Resource);

module.exports.ArchivedResource = ArchivedResource;