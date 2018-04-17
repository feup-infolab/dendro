const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const B2Drop = require("@feup-infolab/node-b2drop").B2Drop;
const Storage = require(Pathfinder.absPathInSrcFolder("/kb/storage/storage.js")).Storage;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Serializers = require(Pathfinder.absPathInSrcFolder("/utils/serializers.js"));
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;

class StorageB2Drop extends Storage
{
    static getRootFolderName ()
    {
        return "/dendro_data";
    }

    constructor (username, password)
    {
        super();

        const self = this;
        self.username = username;
        self.password = password;

        let dendroInstanceDataFolder = Config.host;

        if (Config.port)
        {
            dendroInstanceDataFolder += ("_" + Config.port);
        }

        self.prefix = StorageB2Drop.getRootFolderName() + "/" + slug(dendroInstanceDataFolder, "_");
    }

    _getB2DropPath (file)
    {
        const self = this;
        if (typeof file === "string")
        {
            return self.prefix + file;
        }
        else if (file instanceof Object && !isNull(file.ddr))
        {
            return self.prefix + file.ddr.humanReadableURI;
        }

        Logger.log("error", "Unable to determine the B2drop path uri of resource " + self.uri);
        return null;
    }

    open (callback)
    {
        const self = this;
        self.connection = new B2Drop(this.username, this.password);

        if (!isNull(self.connection))
        {
            self.connection.testConnection(function (err, response)
            {
                if (isNull(err))
                {
                    self.connection.createFolder(self.prefix, function (err, result)
                    {
                        if (isNull(err))
                        {
                            callback(err, self);
                        }
                        else
                        {
                            Logger.log("error", "Unable to create root folder in B2Drop!");
                            Logger.log("error", err);
                            Logger.log("error", result);
                            callback(err, response);
                        }
                    });
                }
                else
                {
                    Logger.log("error", "Error testing connection to b2drop storage!");
                    Logger.log("error", err);
                    Logger.log("error", response);
                    callback(err, self);
                }
            });
        }
        else
        {
            // Logger.log("silly", "Connection to B2Drop is already open");
            callback(null, self);
        }
    }

    close (callback)
    {
        return callback(null);
    }

    put (file, inputStream, callback)
    {
        const self = this;

        inputStream.on("open", function ()
        {
            const targetFilePath = self._getB2DropPath(file);
            const parentFolder = path.dirname(targetFilePath);

            self.open(function (err,response)
            {
                if (isNull(err))
                {
                    const async = require("async");
                    async.series([
                        function (cb)
                        {
                            self.connection.createFolder(parentFolder, function (err, result)
                            {
                                if (isNull(err))
                                {
                                    callback(null);
                                }
                                else
                                {
                                    callback(err, result);
                                }
                            });
                        },
                        function (cb)
                        {
                            if (isNull(self.connection))
                            {
                                self.open(cb);
                            }
                            else
                            {
                                cb(null);
                            }
                        },
                        function (cb)
                        {
                            async.waterfall([
                                function (callback)
                                {
                                    self.connection.put(targetFilePath, inputStream, function (err, response)
                                    {
                                        if (isNull(err))
                                        {
                                            callback(null);
                                        }
                                        else
                                        {
                                            callback(err, response);
                                        }
                                    });
                                },
                                function (callback)
                                {
                                    Folder.findByUri(file.nie.isLogicalPartOf, function (err, folder)
                                    {
                                        if (isNull(err))
                                        {
                                            folder.findMetadataRecursive(function (err, result)
                                            {
                                                if (isNull(err))
                                                {
                                                    const pathRDFfile = parentFolder + "/" + parentFolder.match(/([^\/]*)\/*$/)[1] + ".rdf";
                                                    const Readable = require("stream").Readable;
                                                    var inputStreamRDF = new Readable();
                                                    for (var i = result.descriptors.length - 1; i >= 0; i--)
                                                    {
                                                        for (var t = result.descriptors[i].length - 1; t >= 0; t--)
                                                        {
                                                            if (!isNull(result.descriptors[i][t].locked) && isNull(result.descriptors[i][t].api_writeable))
                                                            {
                                                                result.descriptors.splice(i, 1);
                                                            }
                                                        }
                                                    }
                                                    inputStreamRDF.push(Serializers.metadataToRDF(result));
                                                    inputStreamRDF.push(null);

                                                    self.connection.put(pathRDFfile, inputStreamRDF, function (err, response)
                                                    {
                                                        if (isNull(err))
                                                        {
                                                            callback(null);
                                                        }
                                                        else
                                                        {
                                                            callback(err, response);
                                                        }
                                                    });
                                                }
                                                else
                                                {
                                                    callback(err, self);
                                                }
                                            });
                                        }
                                        else
                                        {
                                            callback(err, self);
                                        }
                                    });
                                }
                            ], function (err, results)
                            {
                                if (!isNull(err))
                                {
                                    Logger.log("error", "Error sending file to b2drop storage!");
                                    Logger.log("error", err);
                                    Logger.log("error", results);
                                    callback(err, self);
                                }
                            });
                        }
                    ]);
                }
                else
                {
                    Logger.log("error", "B2drop: Wrong Credentials");
                    callback(err,self);
                }
            });
        });
    }

    get (file, outputStream, callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.get(self._getB2DropPath(file), outputStream, function (err, result)
            {
                callback(err, result);
            });
        });
    }

    delete (file, callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.delete(self._getB2DropPath(file), function (err, result)
            {
                callback(err, result);
            });
        });
    }

    deleteAll (callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.delete(self.prefix, function (err, result)
            {
                callback(err, result);
            });
        });
    }

    deleteAllInProject (project, callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.checkIfFolderExists(self._getB2DropPath(project), function (err, exists)
            {
                if (isNull(err))
                {
                    if (exists === true)
                    {
                        self.connection.delete(self._getB2DropPath(project), function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        callback(null, null);
                    }
                }
                else
                {
                    callback(err, exists);
                }
            });
        });
    }

    getStorageLimit (callback)
    {
        const self = this;

        self.connection.getQuota(function (err, resp)
            {
                if (isNull(err))
                {
                    return callback(err, {limit: resp.avaiable});
                }

                return callback(err, null);
            }
        );
    }
}

module.exports.StorageB2drop = StorageB2Drop;
