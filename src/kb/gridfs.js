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
};

GridFSConnection.prototype.openConnection = function(callback) {
    var self = this;

    if(self.gfs != null)
    {
        callback(1, "Database connection is already open");
    }
    else
    {
        var mongo = require('mongodb');
        var Grid = require('gridfs-stream');

        var db = new mongo.Db(self.collectionName, new mongo.Server(
            self.hostname,
            self.port,
            {
                auto_reconnect: false,
                poolSize: 4
            }),
            {
                w : 'majority',
                safe : false,
                strict : false
            }
        );

        // make sure the db instance is open before passing into `Grid`
        db.open(function (err) {
            if (!err)
            {
                self.db = db;
                self.gfs = Grid(db, mongo);
                callback(null, self);
            }
            else
            {
                callback(1, err);
            }
        });
    }
};

GridFSConnection.prototype.put = function(fileUri, inputStream, callback, metadata, customBucket) {
    let self = this;
    let message;

    if(self.gfs != null)
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
            callback(1, err);
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

            callback(hasError, message, file);
        });

        inputStream.pipe(uploadStream);
    }
    else
    {
        callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.get = function(fileUri, outputStream, callback, customBucket) {
    let self = this;

    if(self.gfs != null && self.db != null)
    {
        let bucket = new GridFSBucket(self.db, { bucketName: customBucket });
        let downloadStream = bucket.openDownloadStreamByName(fileUri);

        downloadStream.on('error', function(error) {
            if(error.code === "ENOENT" )
            {
                callback(404, error);
            }
            else
            {
                callback(1, error);
            }

        });
        
        downloadStream.on('data', function(data) {
        });

        downloadStream.on('end', function() {
            var msg = "EOF of file";
            console.log(msg);
        });

        downloadStream.on('close', function() {
            var msg = "Finished reading the file";
            console.log(msg);
            callback(0, msg);
        });

        downloadStream.pipe(outputStream);
    }
    else
    {
        callback(1, "Must open connection to database first!");
    }

};

GridFSConnection.prototype.delete = function(fileUri, callback, customBucket) {
    let self = this;

    if(self.gfs != null && self.db != null)
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
                        callback(null, "File " + fileUri + "successfully deleted");
                    }
                    else
                    {
                        callback(err, "Error verifying deletion of file " + fileUri + ". Error reported " + exists);
                    }
                });
            }
            else
            {
                callback(err, "Error deleting file " + fileUri + ". Error reported " + result);
            }
        });
    }
    else
    {
        callback(1, "Must open connection to database first!");
    }

};

GridFSConnection.default = {};

module.exports.GridFSConnection = GridFSConnection;

