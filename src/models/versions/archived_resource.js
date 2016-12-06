var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var _ = require('underscore');
var async = require('async');

function ArchivedResource (object)
{
    ArchivedResource.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(object.rdf.type != null)
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

    var now = new Date();
    if(object.dcterms.created == null)
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

        if(versionNumber != null && typeof versionNumber === 'number' && versionNumber%1 == 0)
        {
            var archivedVersionUri = resourceUri + "/version/" + versionNumber;

            ArchivedResource.findByUri(archivedVersionUri, callback);
        }
        else
        {
            callback(1, versionNumber + " is not a valid integer.");
        }
    }
    catch(ex)
    {
        callback(1, versionNumber + " is not a valid integer. Exception reported : "  + ex);
    }
}

ArchivedResource.findByUri = function(uri, callback)
{
    ArchivedResource.baseConstructor.findByUri(uri, function(err, archivedResource)
    {
        if(!err)
        {
            Change.findByAssociatedRevision(uri, function(err, changes)
            {
                if(!err)
                {
                    archivedResource = new ArchivedResource(JSON.parse(JSON.stringify(archivedResource)));
                    archivedResource.changes = changes;
                    callback(null, archivedResource);
                }
                else
                {
                    callback(1, archivedResource);
                }
            });
        }
        else
        {
            var error = "Unable to find archived resource with uri : " + uri;
            console.error(error);
            callback(1, null);
        }
    });
}

ArchivedResource.prototype.getChanges = function(callback)
{
    var self = this;
    Change.findByAssociatedRevision(self.uri, function(err, changes)
    {
        if(!err)
        {
            callback(null, changes);
        }
        else
        {
            callback(1, changes);
        }

    })
}

ArchivedResource.prototype.getDetailedInformation = function(callback)
{
    var self = this;

    var authorUri = self.ddr.versionCreator;

    var archivedResource = new ArchivedResource(JSON.parse(JSON.stringify(self)));
    archivedResource.changes = self.changes;

    var getAuthorInformation = function(callback)
    {
        User.findByUri(authorUri, function(err, fullVersionCreator){
            if(!err)
            {
                Descriptor.removeUnauthorizedFromObject(fullVersionCreator, [Config.types.private], [Config.types.api_readable]);
                archivedResource.ddr.versionCreator = fullVersionCreator;
                callback(null);
            }
            else
            {
                callback(1);
            }
        });
    }

    var setHumanReadableDate = function(callback)
    {
        var moment = require('moment');
        var humanReadableDate = moment(archivedResource.dcterms.created);

        archivedResource.dcterms.created = humanReadableDate.calendar();
        callback(null);
    }

    var getDescriptorInformation = function(callback)
    {
        var fetchFullDescriptor = function(change, cb)
        {
            Descriptor.findByUri(change.ddr.changedDescriptor, function(err, descriptor)
            {
                if(!err)
                {
                    change.ddr.changedDescriptor = descriptor;
                    cb(null, change);
                }
                else
                {
                    cb(1, null);
                }
            });
        }

        if(archivedResource.changes != null)
        {
            async.map(archivedResource.changes, fetchFullDescriptor, function(err, fullChanges){
                if(!err)
                {
                    archivedResource.changes = fullChanges;
                    Descriptor.removeUnauthorizedFromObject(archivedResource, [Config.types.private], [Config.types.api_readable]);
                    callback(0);
                }
                else
                {
                    callback(1, "Unable to fetch descriptor information. Reported Error: " + fullChanges);
                }
            });
        }
        else
        {
            callback(0);
        }
    }

    var getVersionedResourceDetail = function(callback)
    {
        Resource.findByUri(self.ddr.isVersionOf, function(err, versionedResource){
            if(!err)
            {
                archivedResource.ddr.isVersionOf = versionedResource;
                callback(null);
            }
            else
            {
                callback(1);
            }
        })
    }

    async.series([
        getAuthorInformation,
        setHumanReadableDate,
        getDescriptorInformation,
        getVersionedResourceDetail
    ],
    function(err, result)
    {
        callback(err, archivedResource);
    });
};

ArchivedResource = Class.extend(ArchivedResource, Resource);

module.exports.ArchivedResource = ArchivedResource;