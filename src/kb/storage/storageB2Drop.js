const slug = require("slug");
const async = require("async");

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
        return "dendro_data";
    }

    constructor (username, password)
    {
        super();

        const self = this;
        self.username = username;
        self.password = password;
        self.prefix = StorageB2Drop.getRootFolderName() + "/" + slug(Config.baseUri, "_");
    }

    _getB2DropPath (fileUri)
    {
        const self = this;
        return "/" + self.prefix + "/" + slug(fileUri, "_");
    }

    open (callback)
    {
        const self = this;
        self.connection = new B2Drop(this.username, this.password);

        self.connection.login(function (err, response)
        {
            if (isNull(err))
            {
                const rootFolderPath = "/" + StorageB2Drop.getRootFolderName();
                const projectFolderPath = "/" + self.prefix;

                const seeIfFolderExists = function (folderPath, callback)
                {
                    self.connection.getDirectoryContents(rootFolderPath, function (err, response)
                    {
                        if (err)
                        {
                            if(err.status === 404)
                            {
                                return callback(null, false);
                            }
                            else
                            {
                                return callback(err, response);
                            }
                        }
                        else if (response && response instanceof Array)
                        {
                            return callback(null, true);
                        }
                        else
                        {
                            return callback(1, "Invalid response from server when fetching contents of the B2Drop root folder!");
                        }
                    });
                };

                const createRootFolder = function (folderPath, callback)
                {
                    self.connection.createFolder(rootFolderPath, function (err, response)
                    {
                        if (err)
                        {
                            return callback("Failed to LogIn");
                        }
                        if (response && response.statusCode === 200)
                        {
                            return callback(null);
                        }
                    });
                };

                async.map([rootFolderPath, projectFolderPath], function(folderPath, callback){
                    seeIfFolderExists(folderPath, function(err, exists)
                    {
                        if (err)
                        {
                            return callback(err, "Failed check if the folder "+folderPath+" in B2Share exists");
                        }
                        else
                        {
                            if (!exists)
                            {
                                createRootFolder(folderPath, callback);
                            }
                            else
                            {
                                return callback(null);
                            }
                        }
                    });
                }, callback);
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

    put (fileUri, inputStream, callback)
    {
        const self = this;

        inputStream.on("open", function () {
            const targetFilePath = self._getB2DropPath(fileUri);
            self.connection.put(targetFilePath, inputStream, function(err, result){
                callback(err, result);
            });
        });
    }

    get (fileUri, callback)
    {
        const self = this;
        self.connection.get(self._getB2DropPath(fileUri), callback);
    }

    delete (fileUri, callback)
    {
        const self = this;
        self.connection.delete(self._getB2DropPath(fileUri), callback);
    }
}

module.exports.StorageB2drop = StorageB2Drop;
