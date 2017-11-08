const path = require("path");
const async = require("async");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const util = require("util");
const GridFSBucket = require("mongodb").GridFSBucket;

function GridFSConnection (mongodbHost, mongodbPort, collectionName, username, password)
{
    let self = this;

    self.hostname = mongodbHost;
    self.port = mongodbPort;
    self.collectionName = collectionName;

    self.username = username;
    self.password = password;
}

GridFSConnection.prototype.open = function (callback, customBucket)
{
    const self = this;

    if (!isNull(self.gfs))
    {
        return callback(1, "Database connection is already open");
    }
    const mongo = require("mongodb");
    const Grid = require("gridfs-stream");
    const slug = require("slug");

    const db = new mongo.Db(slug(self.collectionName, "_"), new mongo.Server(
        self.hostname,
        self.port,
        {
            auto_reconnect: false,
            poolSize: 4
        }),
    {
        w: "majority",
        safe: false,
        strict: false
    }
    );

    // make sure the db instance is open before passing into `Grid`
    db.open(function (err)
    {
        if (isNull(err))
        {
            let collectionName;
            if (!isNull(customBucket))
            {
                collectionName = customBucket;
            }
            else
            {
                collectionName = "fs.files";
            }
            db.collection(collectionName).ensureIndex("uri", function (err, result)
            {
                if (isNull(err))
                {
                    self.db = db;
                    self.gfs = Grid(db, mongo);
                    return callback(null, self);
                }
                callback(err, self);
            });
        }
        else
        {
            return callback(1, err);
        }
    });
};

GridFSConnection.prototype.close = function (cb)
{
    const self = this;
    self.db.close(function (err, result)
    {
        cb(err, result);
    });
};

GridFSConnection.prototype.put = function (fileUri, inputStream, callback, metadata, customBucket)
{
    let self = this;
    let message;

    if (!isNull(self.gfs))
    {
        let bucket = new GridFSBucket(self.db, { bucketName: customBucket });
        let uploadStream = bucket.openUploadStream(
            fileUri,
            {
                metadata: metadata,
                w: 1,
                j: true,
                wtimeout: 0
            }
        );

        let hasError = null;

        // streaming to gridfs
        // error handling, e.g. file does not exist
        uploadStream.on("error", function (err)
        {
            hasError = true;
            console.log("An error occurred saving the file to the database!", err);
            return callback(1, err);
        });

        // callback on complete
        uploadStream.once("finish", function (file)
        {
            // console.log('GridFS: Write stream closed for file with uri :'+fileUri);

            if (!hasError)
            {
                message = "GridFS: Save complete for file uri :" + fileUri;
            }
            else
            {
                message = "GridFS: Error saving file with uri :" + fileUri;
            }

            return callback(hasError, message, file);
        });

        inputStream.pipe(uploadStream);
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.get = function (fileUri, outputStream, callback, customBucket)
{
    let self = this;

    if (!isNull(self.gfs) && !isNull(self.db))
    {
        let bucket = new GridFSBucket(self.db, { bucketName: customBucket });
        let downloadStream = bucket.openDownloadStreamByName(fileUri);

        downloadStream.on("error", function (error)
        {
            if (error.code === "ENOENT")
            {
                return callback(404, error);
            }
            return callback(1, error);
        });

        downloadStream.on("data", function (data)
        {
        });

        downloadStream.on("end", function ()
        {
            if (Config.debug.log_temp_file_reads)
            {
                const msg = "EOF of file";
                console.log(msg);
            }
        });

        downloadStream.on("close", function ()
        {
            const msg = "Finished reading the file";

            if (Config.debug.log_temp_file_reads)
            {
                console.log(msg);
            }

            return callback(null, msg);
        });

        downloadStream.pipe(outputStream);
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.delete = function (fileUri, callback, customBucket)
{
    let self = this;

    if (!isNull(self.gfs) && !isNull(self.db))
    {
        let collectionName;
        if (!isNull(customBucket))
        {
            collectionName = customBucket;
        }
        else
        {
            collectionName = "fs.files";
        }

        const collection = self.db.collection(collectionName);

        collection.findOne({filename: fileUri }, { _id: 1 }, function (err, obj)
        {
            if (isNull(err))
            {
                let bucket = new GridFSBucket(self.db, {bucketName: customBucket});
                if (!isNull(obj))
                {
                    bucket.delete(obj._id, function (err)
                    {
                        if (isNull(err))
                        {
                            // Verify that the file no longer exists
                            collection.findOne({filename: fileUri }, function (err, exists)
                            {
                                if (isNull(err) && !exists)
                                {
                                    return callback(null, "File " + fileUri + "successfully deleted");
                                }
                                return callback(err, "Error verifying deletion of file " + fileUri + ". Error reported " + exists);
                            });
                        }
                        else
                        {
                            return callback(err, "Error deleting file " + fileUri + ". Error reported " + err);
                        }
                    });
                }
                else
                {
                    return callback(1, "File with uri " + fileUri + " not found.");
                }
            }
            else
            {
                return callback(err);
            }
        });
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.deleteByQuery = function (query, callback, customBucket)
{
    let self = this;

    let collectionName;
    if (!isNull(customBucket))
    {
        collectionName = customBucket;
    }
    else
    {
        collectionName = "fs.files";
    }

    const collection = self.db.collection(collectionName);
    let bucket = new GridFSBucket(self.db, {bucketName: customBucket});

    if (!isNull(self.gfs) && !isNull(self.db))
    {
        collection.find(query).count(function (err, count)
        {
            if (!err)
            {
                if (count > 0)
                {
                    const cursor = collection.find(query);

                    // create a queue object with concurrency 1
                    const q = async.queue(function (fileRecord, callback)
                    {
                        if (fileRecord != null)
                        {
                            bucket.delete(fileRecord._id, function (err, result)
                            {
                                callback(err, result);
                            });
                        }
                        else
                        {
                            callback(null);
                        }
                    }, 1);

                    // assign a callback
                    q.drain = function ()
                    {
                        // console.log("All files deleted in query " + JSON.stringify(query));
                        if (cursor.isClosed())
                        {
                            collection.find(query).count(function (err, count)
                            {
                                if (isNull(err) && count === 0)
                                {
                                    return callback(null, "Files successfully deleted after query " + JSON.stringify(query));
                                }
                                return callback(err, "Error verifying deletion of files after query " + JSON.stringify(query) + ". Error reported " + count);
                            });
                        }
                        else
                        {
                            callback(1, "There was a problem deleting files after query " + JSON.stringify(query));
                        }
                    };

                    cursor.each(function (err, fileRecord)
                    {
                        q.push(fileRecord);
                    }, function (err)
                    {
                        if (!isNull(err))
                        {
                            return callback(err, "Error deleting files after query " + JSON.stringify(query) + ". Error reported " + err);
                        }
                    });
                }
                else
                {
                    return callback(null, "There are no files corresponding to query " + JSON.stringify(query));
                }
            }
            else
            {
                return callback(1, "Unable to determine the number of files that match query " + JSON.stringify(query));
            }
        });
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.deleteAvatar = function (fileUri, callback, customBucket)
{
    let self = this;

    if (!isNull(self.gfs) && !isNull(self.db))
    {
        let bucket = new GridFSBucket(self.db, {bucketName: customBucket});
        bucket.delete(fileUri, function (err)
        {
            if (!err)
            {
                return callback(null, "File " + fileUri + "successfully deleted");
            }
            return callback(err, "Error deleting file " + fileUri + ". Error reported " + err);
        });
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.default = {};

module.exports.GridFSConnection = GridFSConnection;
