const rlequire = require("rlequire");

const GridFSConnection = rlequire("dendro", "src/kb/gridfs.js").GridFSConnection;
const Storage = rlequire("dendro", "src/kb/storage/storage.js").Storage;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

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
        self.connection.close(function (err, result)
        {
            if (!err)
            {
                self.opened = false;
            }
            callback(err, result);
        });
    }

    put (file, inputStream, callback, metadata, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.put(file.uri, inputStream, function (err, result)
            {
                self.close(function ()
                {
                    callback(err, result);
                }, metadata, customBucket);
            });
        });
    }

    get (file, outputStream, callback, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.get(file.uri,
                outputStream,
                function (err, result)
                {
                    self.close(function ()
                    {
                        callback(err, result);
                    });
                },
                customBucket
            );
        });
    }

    delete (file, callback, customBucket)
    {
        const self = this;
        self.open(function ()
        {
            self.connection.delete(
                file.uri,
                function (err, result)
                {
                    self.close(function ()
                    {
                        callback(err, result);
                    });
                },
                customBucket
            );
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
                    callback(err);
                }
                else
                {
                    Logger.log("error", "Error clearing GridFS storage !");
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
