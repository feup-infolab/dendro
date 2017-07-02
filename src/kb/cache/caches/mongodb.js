const util = require('util');
const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const colors = require('colors');
const MongoClient = require('mongodb').MongoClient;

function MongoDBCache (options)
{
    const self = this;

    self.port = options.port;
    self.host = options.host;
    self.database = options.database;
    self.collection = options.collection;
}

MongoDBCache.prototype.openConnection = function(callback) {
    const self = this;

    if(!isNull(self.client))
    {
        return callback(1, "MongoDB connection is already open.");
    }
    else
    {
        const slug = require('slug');
        const url = "mongodb://" + self.host + ":" + self.port + "/" + slug(self.database, '_');
        MongoClient.connect(url, function(err, db) {
            if(!err)
            {
                console.log("Connected correctly to MONGODB server with config \n" + JSON.stringify(self));
                self.client = db;
                callback(null, self);
            }
            else
            {
                callback(1, db);
            }
        });
    }
};

MongoDBCache.prototype.put = function(resourceUri, object, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(object))
        {
            if(!isNull(self.client))
            {
                self.client.collection(self.collection).replaceOne(
                    { "uri" : resourceUri },
                    object,
                    { "upsert" : true },
                    function(err, results) {
                        if(!err)
                        {
                            if (Config.debug.active && Config.debug.cache.log_cache_writes)
                            {
                                console.log("[DEBUG] Saved cache record for " + resourceUri);
                            }

                            return callback(null);
                        }
                        else
                        {
                            return callback(1, "Unable to set value of " + resourceUri + " as " + JSON.stringify(object) + " into monogdb cache. Error : " + JSON.stringify(results));
                        }
                    });
            }
            else
            {
                return callback(1, "Tried to save a resource into cache providing a null object!");
            }
        }
        else
        {
            return callback(null, null);
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.getByQuery = function(query, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(self.client))
        {
            if(!isNull(query))
            {
                const cursor = self.client.collection(self.collection).find(query);

                cursor.each(function(err, cachedJSON)
                {
                    if(!err)
                    {
                        if(Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            if(!isNull(cachedJSON))
                            {
                                console.log("Cache HIT on " + resourceUri);
                            }
                            else
                            {
                                console.log("Cache MISS on " + resourceUri);
                            }
                        }

                        return callback(null, cachedJSON);
                    }
                    else
                    {
                        console.error("Error running query: " + JSON.stringify(query, null, 4));
                        console.error(err.stack);
                        return callback(err, "Unable to execute query " + JSON.stringify(query) +" from mongodb cache.");
                    }
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
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.get = function(resourceUri, callback) {
    MongoDBCache.prototype.getByQuery({ uri : resourceUri}, callback);
};

MongoDBCache.prototype.delete = function(resourceUriOrArrayOfResourceUris, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(self.client))
        {
            if(!isNull(resourceUriOrArrayOfResourceUris))
            {
                let filterObject;
                if(resourceUriOrArrayOfResourceUris instanceof Array)
                {
                    filterObject = {
                        uri :
                            {
                                $all : resourceUriOrArrayOfResourceUris
                            }
                    };
                }
                else if(typeof resourceUriOrArrayOfResourceUris === "string")
                {
                    filterObject = {
                        uri : resourceUriOrArrayOfResourceUris
                    }
                }

                self.client.collection(self.collection)
                    .deleteMany(
                        filterObject,
                        function (err)
                {
                    if(!err)
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                        {
                            console.log("[DEBUG] Deleted cache records for " + JSON.stringify(resourceUriOrArrayOfResourceUris));
                        }

                        return callback(null, null);
                    }
                    else
                    {
                        const msg = "Unable to delete resource " + resourceUriOrArrayOfResourceUris + " from MongoDB cache " + JSON.stringify(self) + "\n" + err;
                        console.log(msg);
                        return callback(err, msg);
                    }
                });
            }
            else
            {
                return callback(1, "Tried to fetch a resource from cache "+ JSON.stringify(self) + " providing a null resourceUri array!");
            }
        }
        else
        {
            return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.deleteAll = function(callback) {
    const self = this;

    if(Config.cache.active)
    {

        if(!isNull(self.client))
        {
            self.client.collection(self.collection)
                .deleteMany(
                    { },
                    function (err)
                    {
                        if (!err)
                        {
                            if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                            {
                                console.log("[DEBUG] Deleted ALL cache records");
                            }

                            return callback(null);
                        }
                        else
                        {
                            const msg = "Unable to delete collection " + self.collection + " : " + JSON.stringify(err);
                            console.log(msg);
                            return callback(err, msg);
                        }
                    }
                );
        }
        else
        {
            return callback(1, "Must open connection to MongoDB cache "+JSON.stringify(self)+"first!");
        }
    }
    else
    {
        return callback(null, null);
    }

};

MongoDBCache.default = {};

MongoDBCache.type = "mongodb";

module.exports.MongoDBCache = MongoDBCache;

