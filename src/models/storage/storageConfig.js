const async = require("async");

const rlequire = require("rlequire");
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const db = Config.getDBByID();

let StorageConfig = function (object = {})
{
    const self = this;

    const initObject = function ()
    {
        self.addURIAndRDFType(object, "storage_config", StorageConfig);
        StorageConfig.baseConstructor.call(self, object);

        self.copyOrInitDescriptors(object);

        if (isNull(self.ddr.created))
        {
            const now = new Date();
            self.ddr.created = now.toISOString();
        }

        return self;
    };

    if (!isNull(object.ddr) && object.ddr.hasStorageType === "b2drop")
    {
        if (!object.ddr.password || !object.ddr.username)
        {
            throw new Error("Invalid b2drop storage config when creating a storage configuration. Missing ddr.password or ddr.username in parameter object.");
        }
        else
        {
            initObject();
        }
    }
    else if (!isNull(object.ddr) && object.ddr.hasStorageType === "local")
    {
        initObject();

        if (isNull(self.ddr.username))
        {
            self.ddr.username = Config.defaultStorageConfig.username;
        }

        if (isNull(self.ddr.password))
        {
            self.ddr.password = Config.defaultStorageConfig.password;
        }

        if (isNull(self.ddr.host))
        {
            self.ddr.host = Config.defaultStorageConfig.host;
        }

        if (isNull(self.ddr.port))
        {
            self.ddr.port = Config.defaultStorageConfig.port;
        }

        if (isNull(self.ddr.collectionName))
        {
            self.ddr.collectionName = Config.defaultStorageConfig.collectionName;
        }
    }
    else
    {
        throw new Error("Invalid storage type for creating a storage configuration: " + object.ddr.hasStorageType);
    }
};

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
                        async.mapSeries(results, function (result, cb)
                        {
                            StorageConfig.findByUri(result.configuration, function (err, config)
                            {
                                cb(err, config);
                            });
                        },
                        function (err, results)
                        {
                            callback(err, results);
                        });
                    }
                    else
                    {
                        callback(null, null);
                    }
                }
                else
                {
                    callback(1, "Unable to retrieve the storage configuration of project " + projectUri);
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

StorageConfig.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const uuid = require("uuid");
        const newId = uuid.v4();
        callback(null, "/storage_config/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

StorageConfig = Class.extend(StorageConfig, Resource, "ddr:StorageConfig");

module.exports.StorageConfig = StorageConfig;

