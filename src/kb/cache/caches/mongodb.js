const util = require('util');
const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const colors = require('colors');
const MongoClient = require('mongodb').MongoClient;

function MongoDBCache (options)
{
    const self = this;

    self.port = options.port;
    self.host = options.host;
    self.database = options.database;
    self.collection = options.collection;
    self.id = options.id;
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
            if(isNull(err))
            {
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

MongoDBCache.prototype.closeConnection = function(cb)
{
    const self = this;
    self.client.close();
    cb(null, null);
};

MongoDBCache.prototype.put = function(resourceUri, object, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(object))
        {
            if(!isNull(self.client))
            {
                self.client.collection(self.collection).update(
                    { "uri" : resourceUri },
                    object,
                    { "upsert" : true },
                    function(err, results) {
                        if(isNull(err))
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

                cursor.toArray(function(err, cachedResults)
                {
                    if(isNull(err))
                    {
                        if(Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            if(!isNull(cachedResults))
                            {
                                console.log("Cache HIT on " + JSON.stringify(query)+"\n");
                                console.log("Cached : \n " + JSON.stringify(cachedResults, null, 4));
                            }
                            else
                            {
                                console.log("Cache MISS on " + JSON.stringify(query));
                            }
                        }

                        if(cachedResults.length === 0)
                        {
                            return callback(null, null);
                        }
                        else
                        {
                            return callback(null, cachedResults);
                        }
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
    const self = this;
    self.getByQuery({ uri : resourceUri }, function(err, results){
        if(isNull(err))
        {
            if(!isNull(results))
            {
                if(results instanceof Array)
                {
                    if(results.length === 1)
                    {
                        callback(null, results[0]);
                    }
                    else
                    {
                        callback(null, results);
                    }
                }
            }
            else
            {
                return callback(null, null);
            }
        }
        else
        {
            return callback(err, results);
        }
    });
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
                    if(isNull(err))
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                        {
                            console.log("[DEBUG] Deleted cache records for " + JSON.stringify(resourceUriOrArrayOfResourceUris));
                        }

                        return callback(null, null);
                    }
                    else
                    {
                        const msg = "Unable to delete resource " + resourceUriOrArrayOfResourceUris + " from MongoDB cache " + JSON.stringify(self.id) + "\n" + err;
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
                        if (isNull(err))
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

