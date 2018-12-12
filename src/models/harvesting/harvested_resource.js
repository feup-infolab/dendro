const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const db = Config.getDBByID();

function HarvestedResource (object = {})
{
    HarvestedResource.baseConstructor.call(this, object);

    const self = this;

    self.ddr.lastHarvested = object.ddr.lastHarvested;
    self.ddr.md5Checksum = object.ddr.md5Checksum;
    self.ddr.sourceRepository = object.ddr.sourceRepository;

    return self;
}

/**
 * Records a resource harvested from an external source of Linked Open Data into the Dendro Graph
 * @deprecated
 * @param indexConnection Connection to the ElasticSearch cluster
 * @param callback function to call after the resource is saved
 */

HarvestedResource.prototype.save = function (callback, customGraphUri)
{
    const self = this;
    let metadataInsertionString = "";
    let argumentCount = 6;
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    const indexConnection = IndexConnection.getByGraphUri(graphUri);

    const argumentsArray =
    [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.types.resource,
            value: self.uri
        },
        {
            type: Elements.types.resource,
            value: self.sourceRepository.uri
        },
        {
            type: Elements.types.date,
            value: self.timestamp
        },
        {
            type: Elements.types.string,
            value: self.md5Checksum
        },
        {
            type: Elements.types.string,
            value: self.md5Checksum
        }
    ];

    for (let i = 0; i < self.metadata.length; i++)
    {
        const metadataDescriptor = self.metadata[i];

        if (!isNull(metadataDescriptor.namespace) && !isNull(metadataDescriptor.element))
        {
            let predicate = null;

            if (isNull(metadataDescriptor.qualifier))
            {
                predicate = {
                    value: metadataDescriptor.namespace + ":" + metadataDescriptor.element,
                    type: Elements.types.prefixedResource
                };
            }
            else
            {
                predicate = {
                    value: metadataDescriptor.namespace + ":" + metadataDescriptor.qualifier,
                    type: Elements.types.prefixedResource
                };
            }

            metadataInsertionString = metadataInsertionString + "[1] [" + argumentCount + "] [" + (argumentCount + 1) + "] .\n";

            const object = {
                value: metadataDescriptor.value,
                type: Elements.types.string
            };

            argumentsArray.push(predicate);
            argumentsArray.push(object);

            argumentCount = argumentCount + 2;
        }
    }

    // TODO CACHE
    const fullQueryString =
        " DELETE FROM [0]\n" +
        "{ \n" +
        "[1] ?p ?o . \n" +
        "}" +
        "WHERE \n" +
        "{ \n" +
        " FILTER NOT EXISTS " +
        "{ \n" +
        " [1] ddr:md5_checksum [2] .\n" +
        "} \n" +
        "}; \n" +
        " INSERT INTO [0]\n" +
        "{ \n" +
        "   [1] rdf:type ddr:HarvestedResource . \n" +
        "   [1] ddr:last_harvested [3] . \n" +
        "   [1] ddr:md5_checksum [4] . \n" +
        "   [1] dcterms:publisher [5] . \n " +
        "   [2] rdf:type ddr:ExternalRepository . \n " +
        metadataInsertionString +
        "} \n" +
        "WHERE \n" +
        "{ \n" +
        " FILTER NOT EXISTS " +
        "{ \n" +
        " [1] rdf:type ddr:HarvestedResource . \n" +
        " [1] ddr:md5_checksum [3] .\n" +
        "} \n" +
        "} \n";

    db.connection.executeViaJDBC(
        fullQueryString,
        argumentsArray,
        function (err, result)
        {
            if (isNull(err))
            {
                self.reindex(indexConnection, function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null, "Metadata successfully inserted for resource : " + self.uri + " Virtuoso error : " + result);
                    }
                    const error = "Error indexing harvested resource with uri " + self.uri + ". Error reported: " + result;
                    Logger.log("error", error);
                    return callback(1, error);
                });
            }
            else
            {
                return callback(1, "Error inserting metadata for resource : " + self.uri + " : Virtuoso error : " + result);
            }
        }, null, null, null, true
    );
};

HarvestedResource = Class.extend(HarvestedResource, Resource, "ddr:HarvestedResource");

module.exports.HarvestedResource = HarvestedResource;
