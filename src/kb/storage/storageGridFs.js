const Pathfinder = global.Pathfinder;

const GridFSConnection = require(Pathfinder.absPathInSrcFolder("/kb/gridfs.js")).GridFSConnection;
const Storage = require(Pathfinder.absPathInSrcFolder("/kb/storage/storage.js")).Storage;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

class StorageGridFs extends Storage
{
    constructor (username, password, mongodbHost, mongodbPort, collectionName)
    {
        super();
        const self = this;
        self.connection = new GridFSConnection(mongodbHost, mongodbPort, collectionName, username, password);
    }

    open (callback)
    {
        const self = this;
        if (!self.opened)
        {
            self.connection.open(function (err, connection)
            {
                if (isNull(err))
                {
                    self.connection = connection;
                    self.opened = true;
                    callback(err, self);
                }
                else
                {
                    Logger.log("error", "Error opening connection to gridfs storage!");
                    Logger.log("error", err);
                    Logger.log("error", connection);
                    callback(err, self);
                }
            });
        }
        else
        {
            // Logger.log("debug", "Connection to GridFS storage is already open");
            callback(null, self);
        }
    }

    close (callback)
    {
        const self = this;
        self.connection.close(callback);
    }

    put (file, inputStream, callback, metadata, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.put(file.uri, inputStream, callback, metadata, customBucket);
        });
    }

    get (file, outputStream, callback, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.get(file.uri, outputStream, callback, customBucket);
        });
    }

    delete (file, callback, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.delete(file.uri, callback, customBucket);
        });
    }

    deleteAll (callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.deleteByQuery({}, function (err, result)
            {
                if (!err)
                {
                    Logger.log_boot_message("All files in GridFS storage cleared successfully.");
                }
                else
                {
                    callback(err);
                }
            });
        });
    }

    deleteAllInProject (project, callback)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.deleteByQuery({"metadata.project.uri": project.uri}, function (err, result)
            {
                if (isNull(err))
                {
                    Logger.log_boot_message("All files in project " + project.uri + " GridFS storage cleared successfully.");
                }
                else
                {
                    Logger.log("error", "Error deleting all files in project " + project.uri + " !");
                    Logger.log("error", err);
                    Logger.log("error", result);
                }

                callback(err);
            });
        });
    }
}

module.exports.StorageGridFs = StorageGridFs;
