var util = require('util');

var MongoClient = require('mongodb').MongoClient,
    mongo = require('mongodb'),
    ObjectID = require('mongodb').ObjectID,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid;

function GridFSConnection (mongodbHost, mongodbPort, collectionName, username, password)
{
    var self = this;

    self.hostname = mongodbHost;
    self.port = mongodbPort;
    self.collectionName = collectionName;

    self.username = username;
    self.password = password;
}

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

GridFSConnection.prototype.put = function(fileUri, inputStream, callback, metadata) {
    var self = this;

    if(self.gfs != null)
    {
        var requestObject = {
            filename : fileUri,
            metadata: metadata
        };

        // streaming to gridfs
        var writestream = self.gfs.createWriteStream(requestObject);

        //error handling, e.g. file does not exist
        writestream.on('error', function (err) {
            console.log('An error occurred saving the file to the database!', err);
            callback(1, err);
        });

        //callback on complete
        writestream.on('close', function (file) {
            console.log('GridFS: Save complete for file with uri :'+fileUri);
            callback(null, 'GridFS: Save complete for file uri :'+fileUri);
        });

        inputStream.pipe(writestream);
    }
    else
    {
        callback(1, "Must open connection to database first!");
    }
};

GridFSConnection.prototype.get = function(fileUri, outputStream, callback) {
    var self = this;

    if(self.gfs != null && self.db != null)
    {
        new GridStore(self.db, fileUri, "r").open(function(err, gridStore) {
            if(!err)
            {
                // streaming from gridfs
                var stream = gridStore.stream(true);

                stream.on("data", function(chunk) {
                    //console.log('read another chunk of data : ');
                });

                stream.on("end", function() {
                    var msg = "EOF of file";
                    console.log(msg);
                });

                stream.on("close", function() {
                    var msg = "Finished reading the file";
                    console.log(msg);
                    callback(0, msg);
                });

                stream.on("error", function(err){
                    var msg = "Error reading the file : "+ err;
                    console.log(msg);
                    callback(1, msg);
                });

                stream.pipe(outputStream);
            }
            else
            {
                callback(404, "Nothing to be done for file "+ fileUri +" Message reported "+ err);
            }
        });
    }
    else
    {
        callback(1, "Must open connection to database first!");
    }

};

GridFSConnection.prototype.delete = function(fileUri, callback) {
    var self = this;

    if(self.gfs != null && self.db != null)
    {
        new GridStore(self.db, fileUri, "r").open(function(err, gridStore) {
            if(gridStore)
            {
                // Unlink the file
                gridStore.unlink(function(err, result) {
                    if(!err)
                    {
                        // Verify that the file no longer exists
                        GridStore.exist(self.db, fileUri, function(err, exists) {
                            if(!err && !exists)
                            {
                                callback(null, "File "+ fileUri +"successfully deleted");
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
                callback(404, "Nothing to be done for file "+ fileUri +" Message reported "+ err);
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

