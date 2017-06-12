const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return GLOBAL.db.default;
}();
const gfs = function () {
    return GLOBAL.gfs.default;
}();

function HarvestedResource(object)
{
    HarvestedResource.baseConstructor.call(this, object);

    const self = this;

    self.ddr.lastHarvested = object.ddr.lastHarvested;
    self.ddr.md5Checksum = object.ddr.md5Checksum;
    self.ddr.sourceRepository = object.ddr.sourceRepository;

    self.rdf.type = "ddr:HarvestedResource";

    return self;
}

/**
 * Records a resource harvested from an external source of Linked Open Data into the Dendro Graph
 * @deprecated
 * @param indexConnection Connection to the ElasticSearch cluster
 * @param callback function to call after the resource is saved
 */

HarvestedResource.prototype.save = function(indexConnection, callback) {
    const self = this;
    let metadataInsertionString = "";
    let argumentCount = 6;

    const argumentsArray =
        [
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: self.uri
            },
            {
                type: DbConnection.resource,
                value: self.sourceRepository.uri
            },
            {
                type: DbConnection.date,
                value: self.timestamp
            },
            {
                type: DbConnection.string,
                value: self.md5Checksum
            },
            {
                type: DbConnection.string,
                value: self.md5Checksum
            }
        ];

    for(let i = 0; i < self.metadata.length; i++)
    {
        const metadataDescriptor = self.metadata[i];

        if(!isNull(metadataDescriptor.namespace) && !isNull(metadataDescriptor.element))
        {

            let predicate = null;

            if(isNull(metadataDescriptor.qualifier))
            {
                predicate = {
                    value : metadataDescriptor.namespace + ":" + metadataDescriptor.element,
                    type : DbConnection.prefixedResource
                }
            }
            else
            {
                predicate = {
                    value : metadataDescriptor.namespace + ":" + metadataDescriptor.qualifier,
                    type : DbConnection.prefixedResource
                }
            }

            metadataInsertionString = metadataInsertionString + "[1] ["+ argumentCount +"] ["+ (argumentCount+1) +"] .\n";

            const object = {
                value: metadataDescriptor.value,
                type: DbConnection.string
            };

            argumentsArray.push(predicate);
            argumentsArray.push(object);

            argumentCount = argumentCount + 2;
        }
    }


    //TODO CACHE
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

    db.connection.execute(
        fullQueryString,
        argumentsArray,
        function(err, result)
        {
            if(!err)
            {
                self.reindex(indexConnection, function(err, result)
                {
                    if(!err)
                    {
                        callback(null, "Metadata successfully inserted for resource : "+ self.uri + " Virtuoso error : " + result);
                    }
                    else
                    {
                        const error = "Error indexing harvested resource with uri " + self.uri + ". Error reported: " + result;
                        console.error(error);
                        callback(1, error);
                    }

                });
            }
            else
            {
                callback(1, "Error inserting metadata for resource : "+ self.uri + " : Virtuoso error : "+ result);
            }
        }
    );
};

HarvestedResource = Class.extend(HarvestedResource, Resource);

module.exports.HarvestedResource = HarvestedResource;