const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const path = require("path");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const B2Drop = require("@feup-infolab/node-b2drop").B2Drop;
const Storage = rlequire("dendro", "src/kb/storage/storage.js").Storage;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

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

        let dendroInstanceDataFolder = Config.hostAndPort;

        if (Config.port)
        {
            dendroInstanceDataFolder += ("_" + Config.port);
        }

        self.prefix = StorageB2Drop.getRootFolderName() + "/" + slug(dendroInstanceDataFolder);
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
                    return callback(err, result);
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

            self.open(function ()
            {
                self.connection.createFolder(parentFolder, function (err, result)
                {
                    if (isNull(err))
                    {
                        const async = require("async");
                        async.series([
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
                                self.connection.put(targetFilePath, inputStream, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        callback(err, self);
                                        cb(null);
                                    }
                                    else
                                    {
                                        Logger.log("error", "Error sending file to b2drop storage!");
                                        Logger.log("error", err);
                                        Logger.log("error", response);
                                        callback(err, self);
                                    }
                                });
                            }
                        ]);
                    }
                    else
                    {
                        Logger.log("error", "Error creating base folder in b2drop storage!");
                        Logger.log("error", err);
                        Logger.log("error", result);
                        callback(err, self);
                    }
                });
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
}

module.exports.StorageB2drop = StorageB2Drop;
