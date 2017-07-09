const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

const util = require('util');
const GridFSBucket = require('mongodb').GridFSBucket;

function GridFSConnection (mongodbHost, mongodbPort, collectionName, username, password)
{
    let self = this;

    self.hostname = mongodbHost;
    self.port = mongodbPort;
    self.collectionName = collectionName;

    self.username = username;
    self.password = password;
}

GridFSConnection.prototype.openConnection = function(callback) {
    const self = this;

    if(!isNull(self.gfs))
    {
        return callback(1, "Database connection is already open");
    }
    else
    {
        const mongo = require('mongodb');
        const Grid = require('gridfs-stream');

        const db = new mongo.Db(self.collectionName, new mongo.Server(
            self.hostname,
            self.port,
            {
                auto_reconnect: false,
                poolSize: 4
            }),
            {
                w: 'majority',
                safe: false,
                strict: false
            }
        );

        // make sure the db instance is open before passing into `Grid`
        db.open(function (err) {
            if (!err)
            {
                self.db = db;
                self.gfs = Grid(db, mongo);
                return callback(null, self);
            }
            else
            {
                return callback(1, err);
            }
        });
    }
};

GridFSConnection.prototype.closeConnection = function(cb)
{
    const self = this;
    self.db.close();
    cb(null, null);
};

GridFSConnection.prototype.put = function(fileUri, inputStream, callback, metadata, customBucket) {
    let self = this;
    let message;

    if(!isNull(self.gfs))
    {
        let bucket = new GridFSBucket(self.db, { bucketName: customBucket });
        let uploadStream = bucket.openUploadStream(
            fileUri,
            {
                metadata : metadata
            }
        );

        let hasError = null;

        // streaming to gridfs
        //error handling, e.g. file does not exist
        uploadStream.on('error', function (err) {
            hasError = true;
            console.log('An error occurred saving the file to the database!', err);
            return callback(1, err);
        });

        //callback on complete
        uploadStream.once('finish', function (file) {
            console.log('GridFS: Write stream closed for file with uri :'+fileUri);
            
            if(!hasError)
            {
                
                message = 'GridFS: Save complete for file uri :'+fileUri;
            }
            else
            {
                message = 'GridFS: Error saving file with uri :'+fileUri;
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

GridFSConnection.prototype.get = function(fileUri, outputStream, callback, customBucket) {
    let self = this;

    if(!isNull(self.gfs) && !isNull(self.db))
    {
        let bucket = new GridFSBucket(self.db, { bucketName: customBucket });
        let downloadStream = bucket.openDownloadStreamByName(fileUri);

        downloadStream.on('error', function(error) {
            if(error.code === "ENOENT" )
            {
                return callback(404, error);
            }
            else
            {
                return callback(1, error);
            }

        });
        
        downloadStream.on('data', function(data) {
        });

        downloadStream.on('end', function() {
            const msg = "EOF of file";
            console.log(msg);
        });

        downloadStream.on('close', function() {
            const msg = "Finished reading the file";
            console.log(msg);
            return callback(null, msg);
        });

        downloadStream.pipe(outputStream);
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }

};

GridFSConnection.prototype.delete = function(fileUri, callback, customBucket) {
    let self = this;

    if(!isNull(self.gfs) && !isNull(self.db))
    {
        let bucket = new GridFSBucket(self.db, {bucketName: customBucket});
        bucket.delete(fileUri, function (err)
        {
            if (!err)
            {
                // Verify that the file no longer exists
                self.db.find(fileUri, function (err, exists)
                {
                    if (!err && !exists)
                    {
                        return callback(null, "File " + fileUri + "successfully deleted");
                    }
                    else
                    {
                        return callback(err, "Error verifying deletion of file " + fileUri + ". Error reported " + exists);
                    }
                });
            }
            else
            {
                return callback(err, "Error deleting file " + fileUri + ". Error reported " + result);
            }
        });
    }
    else
    {
        return callback(1, "Must open connection to database first!");
    }

};

GridFSConnection.default = {};

module.exports.GridFSConnection = GridFSConnection;

