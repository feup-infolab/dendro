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
DataStoreConnection.prototype.close = function(callback) {
    const self = this;
    self.client.close(function(err, result){
        callback(err, result);
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
DataStoreConnection.prototype.getWholeData = function(writeStream, callback) {
    DataStoreConnection.prototype.getDataByQuery({}, writeStream, callback);
};
DataStoreConnection.prototype.clearData = function(callback) {
    const self = this;
    if(!isNull(self.client))
    {
        db.collectionNames(self.collection, function(err, names) {
            if(isNull(err))
            {
                if(names.length > 0){
                    self.client.collection(self.collection).drop(function(err, result){
                        callback(err, result);
                    });
                }
                else
                {
                    callback(null, "Collection " + self.collection + " does not exist, so there was no need to clear the data.");
                }
            }
            else
            {
                callback(err, "Error checking for collection " + self.collection);
            }
        });
    }
    else
    {
        return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
    }
};
DataStoreConnection.prototype.updateDataFromStream = function(sourceStream, callback) {
    const self = this;
    if(!isNull(self.client))
    {
        self.clearData(function(err, result){
            const bulkMongo = require('bulk-mongo');
            const factory_function = bulkMongo(self.client);
            const bulkWriter = factory_function(self.collection);

            sourceStream.on("end", function(err, result){
                self.close(function(err, result){
                    if(isNull(err))
                    {
                        if (Config.datastore.log.log_datastore_ops)
                        {
                            console.log("[DEBUG] Saved data record for " + self.resourceUri + " in DataStoreConnection");
                        }

                        return callback(null);
                    }
                    else
                    {
                        return callback(1, "Unable to set data contained in " + self.resourceUri + " as " + JSON.stringify(object) + " into monogdb cache. Error : " + JSON.stringify(results));
                    }
                });
            });

            sourceStream.pipe(bulkWriter);

            bulkWriter.on("close", function(err, result){
                callback(null, result);
            });

            bulkWriter.on("error", function(err, result){
                callback(err, result);
            });
        });
    }
    else
    {
        return callback(1, "Open the connection to the DataStoreConnection first !");
    }
};
DataStoreConnection.prototype.updateDataFromArrayOfObjects = function(arrayOfDataObjects, callback) {
    const self = this;
    if(!isNull(self.client))
    {
        self.clearData(function(err, result){

            const createNewEntries = function(db, entries, callback) {

                //from https://stackoverflow.com/questions/34530348/correct-way-to-insert-many-records-into-mongodb-with-node-js
                // Get the collection and bulk api artefacts
                let collection = self.client,
                    bulk = collection.initializeOrderedBulkOp(), // Initialize the Ordered Batch
                    counter = 0;

                // Execute the forEach method, triggers for each entry in the array
                entries.forEach(function(obj) {

                    bulk.insert(obj);
                    counter++;

                    if (counter % 1000 === 0 ) {
                        // Execute the operation
                        bulk.execute(function(err, result) {
                            // re-initialise batch operation
                            bulk = collection.initializeOrderedBulkOp();
                            callback(err, result);
                        });
                    }
                });

                if (counter % 1000 !== 0 ){
                    bulk.execute(function(err, result) {
                        // do something with result
                        callback(err, result);
                    });
                }
            };

            createNewEntries(arrayOfDataObjects, callback);
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

    const newDataStore = new DataStoreConnection(Config.datastore);
    newDataStore.open(function(err, openDataStore){
        callback(err, openDataStore);
    });
};
DataStoreConnection.deleteAllDataOfAllResources = function(callback) {
    const self = this;

    if(!isNull(self.client))
    {
        self.client.drop(function (err) {
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

};

module.exports.DataStoreConnection = DataStoreConnection;

