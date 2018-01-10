const async = require("async");

const Pathfinder = global.Pathfinder;
const Resource = require(Pathfinder.absPathInSrcFolder("models/resource.js")).Resource;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const db = Config.getDBByID();

function StorageConfig (object)
{
    const self = this;
    self.addURIAndRDFType(object, "storageConfig", StorageConfig);
    StorageConfig.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const now = new Date();

    self.ddr.created = now.toISOString();

    return self;
}

StorageConfig.findByProject = function (projectUri, callback, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;
    if (!isNull(projectUri))
    {
        const query =
            "SELECT ?configuration\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   ?configuration ddr:handlesStorageForProject [1] \n" +
            "} \n";

        db.connection.executeViaJDBC(query, [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            },
            {
                type: Elements.ontologies.ddr.handlesStorageForProject.type,
                value: projectUri
            }
        ], function (err, results)
        {
            if (isNull(err))
            {
                if (!isNull(results) && results instanceof Array)
                {
                    if (results.length > 0)
                    {
                        async.map(results, function (result, cb)
                        {
                            StorageConfig.findByUri(result.configuration, function (err, config)
                            {
                                cb(err, config);
                            });
                        });
                    }
                    else
                    {
                        callback(null, null);
                    }
                }
            }
            else
            {
                return callback(err, results);
            }
        });
    }
    else
    {
        callback(1, "Project Uri or Storage Type missing when retrieving a storage configuration.");
    }
};

StorageConfig.findByProjectAndType = function (projectUri, storageType, callback, customGraphUri)
{
    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;
    if (!isNull(projectUri) && !isNull(storageType))
    {
        const query =
            "SELECT ?configuration\n" +
            "FROM [0] \n" +
            "WHERE \n" +
            "{ \n" +
            "   ?configuration ddr:handlesStorageForProject [1] . \n" +
            "   ?configuration rdf:hasStorageType [2] . \n" +
            "} \n";

        db.connection.executeViaJDBC(query, [
            {
                type: Elements.types.resourceNoEscape,
                value: graphUri
            },
            {
                type: Elements.ontologies.ddr.handlesStorageForProject.type,
                value: projectUri
            },
            {
                type: Elements.ontologies.ddr.hasStorageType.type,
                value: storageType
            }
        ], function (err, results)
        {
            if (isNull(err))
            {
                if (!isNull(results) && results instanceof Array)
                {
                    if (results.length === 1)
                    {
                        StorageConfig.findByUri(results[0].configuration, function (err, config)
                        {
                            callback(err, config);
                        });
                    }
                    else if (results.length === 0)
                    {
                        callback(null, null);
                    }
                    else
                    {
                        const msg = "There are more than one storage configuration of type " + storageType + " for project " + projectUri + " !";
                        Logger.log("error", msg);
                        callback(1, msg);
                    }
                }
            }
            else
            {
                return callback(err, results);
            }
        });
    }
    else
    {
        callback(1, "Project Uri or Storage Type missing when retrieving a storage configuration.");
    }
};

StorageConfig = Class.extend(StorageConfig, Resource, "ddr:StorageConfig");

module.exports.StorageConfig = StorageConfig;

