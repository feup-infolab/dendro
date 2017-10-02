const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const db = Config.getDBByID();

const async = require("async");

function Change (object)
{
    const self = this;
    self.addURIAndRDFType(object, "change", Change);
    Change.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.ddr.created = now.toISOString();

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
                type : Elements.types.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : Elements.types.resource,
                value : revisionUri
            }
        ],
        function(err, results) {
            if(isNull(err))
            {
                const fetchFullChange = function (changeResultRow, cb) {
                    Change.findByUri(changeResultRow.uri, function (err, change) {
                        if (isNull(err)) {
                            cb(null, change);
                        }
                        else {
                            cb(1, null);
                        }
                    });
                };

                async.map(results, fetchFullChange, function(err, fullChanges){
                    if(isNull(err))
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