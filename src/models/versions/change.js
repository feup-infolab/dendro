const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const db = Config.getDBByID();

const async = require("async");

function Change (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "change", Change);
    Change.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.ddr.created = now.toISOString();

    return self;
}

Change.findByAssociatedRevision = function (revisionUri, callback)
{
    const query =
        "WITH [0] \n" +
        "SELECT ?uri \n" +
        "WHERE { \n" +
        "?uri rdf:type ddr:Change . \n" +
        "?uri ddr:pertainsTo [1] . \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.ddr.pertainsTo.type,
                value: revisionUri
            }
        ],
        function (err, results)
        {
            if (isNull(err))
            {
                const fetchFullChange = function (changeResultRow, cb)
                {
                    Change.findByUri(changeResultRow.uri, function (err, change)
                    {
                        if (isNull(err))
                        {
                            cb(null, change);
                        }
                        else
                        {
                            cb(1, null);
                        }
                    });
                };

                async.mapSeries(results, fetchFullChange, function (err, fullChanges)
                {
                    if (isNull(err))
                    {
                        return callback(null, fullChanges);
                    }
                    return callback(1, "Error fetching full changes of the revision " + revisionUri);
                });
            }
            else
            {
                return callback(1, "Unable to fetch all changes for resource " + revisionUri);
            }
        });
};

/* Change.prototype.save = function(callback)
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
        Logger.log("error","Attempt to record a change on a locked descriptor. debug please. ");
        return callback(null, null);
    }
} */

Change = Class.extend(Change, Resource, "ddr:Change");

module.exports.Change = Change;
