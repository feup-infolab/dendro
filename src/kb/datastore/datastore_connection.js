const util = require('util');
const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const colors = require("colors");
const MongoClient = require('mongodb').MongoClient;
const slug = require('slug');

function DataStoreConnection (options) {
    const self = this;

    self.port = options.port;
    self.host = options.host;
    self.database = options.database;
    self.resourceUri = options.resourceUri;
    self.collection = slug(self.resourceUri, '_');
    self.counter = 0;
}

DataStoreConnection.prototype.open = function(callback) {
    const self = this;

    if(!isNull(self.client))
    {
        return callback(1, "DataStoreConnection connection is already open.");
    }
    else
    {
        const url = "mongodb://" + self.host + ":" + self.port + "/" + slug(self.database, '_');
        MongoClient.connect(url, function(err, db) {
            if(isNull(err))
            {
                self.client = db;
                callback(null, self);
            }
            else
            {
                callback(err, db);
            }
        });
    }
};
DataStoreConnection.prototype.close = function() {
    const self = this;
    self.client.close(function(err, result){
        if(!err)
        {
            self.emit("close");
        }
        else
        {
            self.emit("error");
        }
    });
};
DataStoreConnection.prototype.getDataByQuery = function(query, writeStream, callback) {
    const self = this;
    if(!isNull(self.client))
    {
        if(!isNull(query))
        {
            self.client.collection(self.collection).find(query);

            cursor.on('data', function(doc) {
                writeStream.write(doc);
            });

            cursor.once('end', function(error, result) {
                callback(error, result);
            });
        }
        else
        {
            return callback(1, "Tried to fetch a resource from cache "+ JSON.stringify(self) + " providing a null resourceUri!");
        }
    }
    else
    {
        return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
    }
};
DataStoreConnection.prototype.getData = function(writeStream, callback) {
    DataStoreConnection.prototype.getDataByQuery({}, writeStream, callback);
};
DataStoreConnection.prototype.clearData = function(callback) {
    const self = this;
    if(!isNull(self.client))
    {
        self.client.collection(self.collection).drop(function(err, result){
            if(isNull(err) || err.errmsg === "ns not found")
                callback(null, result);
            else
                callback(err, result);
        });
    }
    else
    {
        return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
    }
};

DataStoreConnection.prototype.appendArrayOfObjects = function(arrayOfRecords, callback) {
    const self = this;

    if(self.counter === 0 && arrayOfRecords.length > 0)
    {
        self.header = arrayOfRecords[0];
    }

    const createNewEntries = function(entries, callback) {

        //from https://stackoverflow.com/questions/34530348/correct-way-to-insert-many-records-into-mongodb-with-node-js
        // Get the collection and bulk api artefacts
        let collection = self.client.collection(self.collection),
            bulk = collection.initializeOrderedBulkOp(); // Initialize the Ordered Batch

        // Execute the forEach method, triggers for each entry in the array

        for(let i = 0; i < entries.length; i++)
        {
            let obj = {};
            obj[self.counter] = entries[i];

            bulk.insert(obj);
            self.counter++;

            if (self.counter % 1000 === 0)
            {
                // Execute the operation
                bulk.execute(function (err, result)
                {
                    // re-initialise batch operation
                    if(!err)
                    {
                        bulk = collection.initializeOrderedBulkOp();
                    }
                    else
                    {
                        callback(err, result);
                    }
                });
            }
        }

        if (self.counter % 1000 !== 0 ){
            bulk.execute(function(err, result) {
                // do something with result
                callback(err, result);
            });
        }
        else
        {
            callback(null);
        }

    };

    if(!isNull(self.client))
    {
        createNewEntries(arrayOfRecords, callback);
    }
    else
    {
        return callback(1, "Open the connection to the DataStoreConnection first !");
    }
};

DataStoreConnection.prototype.updateDataFromArrayOfObjects = function(arrayOfRecords, callback) {
    const self = this;

    if(!isNull(self.client))
    {
        self.clearData(function(err, result){
            self.appendArrayOfObjects(arrayOfRecords, callback);
        });
    }
    else
    {
        return callback(1, "Open the connection to the DataStoreConnection first !");
    }
};

DataStoreConnection.create = function(resourceUri, callback) {
    const parameters = JSON.parse(JSON.stringify(Config.datastore));
    parameters.resourceUri = resourceUri;

    const newDataStore = new DataStoreConnection(parameters);
    newDataStore.open(function(err, openDataStore){
        callback(err, openDataStore);
    });
};
DataStoreConnection.deleteAllDataOfAllResources = function(callback) {
    const self = this;

    DataStoreConnection.create("NO_RES", function(err, openDataStore){
        if(!err)
        {
            if(!isNull(openDataStore))
            {
                openDataStore.client.dropDatabase(function (err) {
                    if (isNull(err) || err.message === "ns not found")
                    {
                        if (Config.debug.active && Config.datastore.log.log_datastore_ops)
                        {
                            console.log("[DEBUG] Deleted ALL datastore records");
                        }

                        return callback(null);
                    }
                    else
                    {
                        const msg = "Unable to delete database " + self.database + " : " + JSON.stringify(err);
                        console.log(msg);
                        return callback(err, msg);
                    }
                });
            }
            else
            {
                return callback(1, "Open the connection to the DataStoreConnection first !");
            }
        }
        else
        {
            return callback(err, "Unable to open the connection to the DataStoreConnection!");
        }

    });
};

module.exports.DataStoreConnection = DataStoreConnection;

