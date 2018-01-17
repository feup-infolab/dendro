const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const B2Drop = require("@feup-infolab/node-b2drop").B2Drop;
const Storage = require(Pathfinder.absPathInSrcFolder("/kb/storage/storage.js")).Storage;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

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
        return self.prefix + file.ddr.humanReadableURI;
    }

    open (callback)
    {
        const self = this;
        self.connection = new B2Drop(this.username, this.password);

        self.connection.login(function (err, response)
        {
            if (isNull(err))
            {
                self.connection.createFolder(self.prefix, function (err, result)
                {
                    callback(err, self);
                });
            }
            else
            {
                Logger.log("error", "Unable to create root folder in B2Drop");
                return callback(err, response);
            }
        });
    }

    close (callback)
    {
        const self = this;
        self.connection = null;
        return callback(null);
    }

    put (file, inputStream, callback)
    {
        const self = this;

        inputStream.on("open", function ()
        {
            const targetFilePath = self._getB2DropPath(file);
            const parentFolder = path.dirname(targetFilePath);

            self.connection.createFolder(parentFolder, function (err, result)
            {
                if (isNull(err))
                {
                    self.connection.put(targetFilePath, inputStream, function (err, result)
                    {
                        callback(err, result);
                    });
                }
                else
                {
                    callback(err, self);
                }
            });
        });
    }

    get (file, outputStream, callback)
    {
        const self = this;
        self.connection.get(self._getB2DropPath(file), outputStream, function (err, result)
        {
            callback(err, result);
        });
    }

    delete (file, callback)
    {
        const self = this;
        self.connection.delete(self._getB2DropPath(file), function (err, result)
        {
            callback(err, result);
        });
    }

    deleteAll (callback)
    {
        const self = this;
        self.connection.delete(self.prefix, function (err, result)
        {
            callback(err, result);
        });
    }

    deleteAllInProject (project, callback)
    {
        const self = this;
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
    }
}

module.exports.StorageB2drop = StorageB2Drop;
