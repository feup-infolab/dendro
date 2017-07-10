const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const db = Config.getDBByID();

const async = require('async');

function Change (object)
{
    Change.baseConstructor.call(this, object, Change);
    const self = this;

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.dcterms.created = now.toISOString();

    if(isNull(self.uri))
    {
        const uuid = require('uuid');
        self.uri = "/r/change/" + uuid.v4();
    }

    return self;
}

Change.findByAssociatedRevision = function(revisionUri, callback)
{
    const query =
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
                const fetchFullChange = function (changeResultRow, cb) {
                    Change.findByUri(changeResultRow.uri, function (err, change) {
                        if (!err) {
                            cb(null, change);
                        }
                        else {
                            cb(1, null);
                        }
                    });
                };

                async.map(results, fetchFullChange, function(err, fullChanges){
                    if(!err)
                    {
                        return callback(null, fullChanges);
                    }
                    else
                    {
                        return callback(1, "Error fetching full changes of the revision " + revisionUri);
                    }
                });
            }
            else
            {
                return callback(1, "Unable to fetch all changes for resource " + revisionUri);
            }
        });
};

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
        return callback(null, null);
    }
}*/

Change = Class.extend(Change, Resource, "ddr:Change");

module.exports.Change = Change;