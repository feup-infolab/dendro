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
    self.counter = 1;
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
    self.client.close();
};

DataStoreConnection.prototype.getSheets = function(callback) {
    const self = this;
    const queryObject = {
        "resource": self.uri
    };

    const cursor = self.client.collection(DataStoreConnection.SHEETS_CATALOG_COLLECTION)
        .find(queryObject,   {"_id" : 0} )
        .sort([["index", 1]]);

    cursor.toArray(function(err, results) {
        callback(err, results);
        self.close();
    });
};

DataStoreConnection.prototype.createSheetRecord = function(sheetName, sheetIndex, callback) {
    const self = this;
    const newSheetObject = {
        "resource": self.resourceUri
    };

    if(!isNull(sheetIndex))
    {
        newSheetObject.index = sheetIndex;
    }

    if(!isNull(sheetName))
    {
        newSheetObject.name = sheetName;
    }

    self.client.collection(DataStoreConnection.SHEETS_CATALOG_COLLECTION)
        .insert(newSheetObject, function(err, result){
            callback(err, result);
        });
};

DataStoreConnection.prototype.getDataByQuery = function(query, writeStream, skip, limit, sheetIndex, outputFormat) {
    const self = this;
    let JSONStream = require("JSONStream");
    if(!isNull(self.client))
    {
        const queryObject = {
            "$and": []
        };


        if(!isNull(query) && JSON.stringify(query) !== "{}")
        {
            queryObject["$and"].push({
                data: query
            });
        }

        if(isNull(skip) || isNaN(skip))
        {
            skip = 0;
        }

        if(isNull(limit) || isNaN(limit))
        {
            limit = 1000; //1000 rows by default
        }

        if(isNull(sheetIndex) || isNaN(sheetIndex))
        {
            sheetIndex = 0;
        }


        //pagination
        queryObject["$and"].push({row : { "$gte" : skip}});
        queryObject["$and"].push({row : { "$lte" : skip + limit}});

        //sheet index
        queryObject["$and"].push({sheet_index : sheetIndex});

        const cursor = self.client.collection(self.collection)
            .find(queryObject,  { "sheet_index" : 0, "_id" : 0})
            .sort([["row", 1]]);

        if(outputFormat === "csv")
        {
            const getRowInCSV = function(data)
            {
                let row = "";
                if(!isNull(data))
                {
                    let keys = Object.keys(data);

                    for(let i = 0; i < keys.length; i++)
                    {
                        let key = keys[i];
                        if(data.hasOwnProperty(key))
                        {
                            row += data[key];
                        }

                        if(i < keys.length - 1)
                        {
                            row += ",";
                        }
                    }
                }

                return row;
            };

            cursor.toArray(function(err, results) {
                for(let i = 0; i < results.length; i++)
                {
                    let csvRow = getRowInCSV(results[i].data);
                    writeStream.write(csvRow);

                    if(i < results.length - 1)
                    {
                        writeStream.write("\n");
                    }
                }

                writeStream.end();
                self.close();
            });
        }
        else
        {
            cursor.stream().pipe(JSONStream.stringify()).pipe(writeStream);
            cursor.on('end', function(){
                self.close();
            })
        }
    }
    else
    {
        return callback(1, "Must open connection to MongoDB datastore "+JSON.stringify(self)+"first!");
    }
};
DataStoreConnection.prototype.getData = function(writeStream, callback, sheetName, outputFormat) {
    DataStoreConnection.prototype.getDataByQuery({}, writeStream, null, null, sheetName, callback, outputFormat);
};
DataStoreConnection.prototype.clearData = function(callback, sheetIndex) {
    const self = this;
    if(!isNull(self.client))
    {
        const clearDataRecords = function(callback)
        {
            self.client.collection(self.collection).deleteMany({ "sheet_index" : sheetIndex }, function(err, result){
                if(isNull(err))
                {
                    self.client.collection(self.collection).count({}, function(err, result){
                        if(isNull(err))
                        {
                            if(result === 0)
                            {
                                self.client.collection(self.collection).drop(function(err, result){
                                    if(isNull(err) || err.errmsg === "ns not found")
                                    {
                                        callback(null);
                                    }
                                    else
                                    {
                                        callback(err, result);
                                    }
                                });
                            }
                            else
                            {
                                callback(null);
                            }
                        }
                        else
                        {
                            callback(err, result);
                        }
                    });
                }
                else
                {
                    callback(err, result);
                }
            });
        }

        const clearSheetRecord = function(callback)
        {
            let clearSheetQuery = {"resource" : self.uri };

            if(!isNull(sheetIndex))
                clearSheetQuery.index = sheetIndex;

            self.client.collection(DataStoreConnection.SHEETS_CATALOG_COLLECTION).deleteMany(clearSheetQuery, function(err, result){
                if(isNull(err) || err.errmsg === "ns not found")
                {
                    callback(err, result);
                }
                else
                {
                    callback(err, result);
                }

            })
        }

        const async = require('async');
        async.series([clearDataRecords, clearSheetRecord], callback);
    }
    else
    {
        return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
    }
};

DataStoreConnection.prototype.appendArrayOfObjects = function(arrayOfRecords, callback, sheetName, sheetIndex) {
    const self = this;

    if(isNull(sheetIndex))
        sheetIndex = 0;

    const createNewEntries = function(entries, callback) {
        
        let collection = self.client.collection(self.collection);

        let formattedEntries = [];
        for(let i = 0; i < entries.length; i++)
        {
            let obj = {};
            obj["sheet_index"] = sheetIndex;
            obj["row"] = self.counter;
            obj["data"] = entries[i];

            formattedEntries.push(obj);
            self.counter++;
        }

        // Execute the operation
        collection.insertMany(
            formattedEntries,
            function(err, result){
                callback(err, result);
            });
    };

    if(!isNull(self.client))
    {
        createNewEntries(arrayOfRecords, function(err, result){
            callback(err, result);
        });
    }
    else
    {
        return callback(1, "Open the connection to the DataStoreConnection first !");
    }
};

DataStoreConnection.prototype.updateDataFromArrayOfObjects = function(arrayOfRecords, callback, sheetName, sheetIndex) {
    const self = this;

    if(!isNull(self.client))
    {
        self.clearData(function(err, result){
            if(isNull(err))
            {
                self.createSheetRecord(sheetName, sheetIndex, function(err, result){
                    if(isNull(err))
                    {
                        self.appendArrayOfObjects(arrayOfRecords, callback, sheetName, sheetIndex);
                    }
                    else
                    {
                        callback(1, "Unable to create Sheet Record for sheet "+sheetName+ ", with index " + sheetIndex + " of resource " + self.resourceUri);
                    }
                });
            }
            else
            {
                callback(1, "Unable to Delete existing records for sheet "+sheetName+ ", with index " + sheetIndex + " of resource " + self.resourceUri);
            }
        }, sheetIndex);
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

DataStoreConnection.SHEETS_CATALOG_COLLECTION = "sheets_catalog";

module.exports.DataStoreConnection = DataStoreConnection;

