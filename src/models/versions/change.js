var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');

function Change (object)
{
    Change.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Change";

    var now = new Date();
    self.dcterms.created = now.toISOString();

    return self;
}

Change.findByAssociatedRevision = function(revisionUri, callback)
{
    var query =
        "WITH [0] \n" +
        "SELECT ?uri \n" +
        "WHERE { \n" +
            "?uri rdf:type ddr:Change . \n" +
            "?uri ddr:pertainsTo [1] . \n" +
        "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : revisionUri
            }
        ],
        function(err, results) {
            if(!err)
            {
                var fetchFullChange = function(changeResultRow, cb)
                {
                    Change.findByUri(changeResultRow.uri, function(err, change)
                    {
                        if(!err)
                        {
                            cb(null, change);
                        }
                        else
                        {
                            cb(1, null);
                        }
                    });
                };

                async.map(results, fetchFullChange, function(err, fullChanges){
                    if(!err)
                    {
                        callback(null, fullChanges);
                    }
                    else
                    {
                        callback(1, "Error fetching full changes of the revision " + revisionUri);
                    }
                });
            }
            else
            {
                callback(1, "Unable to fetch all changes for resource " + revisionUri);
            }
        });
}

/*Change.prototype.save = function(callback)
{
    var self = this;
    var changedDescriptor = new Descriptor({
        uri : self.ddr.changedDescriptor
    });

    //changes on audit-only descriptors are not meant to be recorded as such,
    // as they are automatically managed and created by the system
    if(!changedDescriptor.audit)
    {
        self.baseConstructor.save(callback);
    }
    else
    {
        console.error("Attempt to record a change on a locked descriptor. debug please. ");
        callback(0, null);
    }
}*/

Change = Class.extend(Change, Resource);

module.exports.Change = Change;