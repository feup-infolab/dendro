const rlequire = require("rlequire");

const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Datastore = require("nedb");

function NeDBCache (options)
{
    const self = this;
    self.id = options.id;

    self.hits = 0;
    self.misses = 0;
}

NeDBCache.prototype.getHitRatio = function ()
{
    const self = this;
    if ((self.hits + self.misses) !== 0)
    {
        return self.hits / (self.hits + self.misses);
    }
    return "No cache accesses recorded";
};

NeDBCache.prototype.open = function (callback)
{
    const self = this;

    if (!isNull(self.client))
    {
        return callback(1, "NeDB connection is already open.");
    }

    self.client = new Datastore();
    callback(null);
};

NeDBCache.prototype.close = function (cb)
{
    const self = this;
    if (!isNull(self.client))
    {
        delete self.client;
        cb(null);
    }
    else
    {
        cb(null);
    }
};

NeDBCache.prototype.put = function (resourceUri, object, callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(object))
        {
            if (!isNull(self.client))
            {
                const options = { upsert: true };

                self.client.update({uri: object.uri}, object, options, function (err, results)
                {
                    if (isNull(err))
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_writes)
                        {
                            Logger.log("debug", "Saved new cache record for " + resourceUri + ": " + JSON.stringify(object));
                        }

                        return callback(null);
                    }

                    return callback(err, "Unable to insert new cache record  for " + resourceUri + " as " + JSON.stringify(object) + " into neDB cache. Error : " + JSON.stringify(err));
                });
            }
            else
            {
                return callback(1, "Need to open the cache connection to Nedb cache " + self.id + "before putting any documents !");
            }
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
};

NeDBCache.prototype.getByQuery = function (query, callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(query))
            {
                self.client.find(query).sort({ "ddr.modified": -1 }).limit(1).exec(function (err, result)
                {
                    if (Config.debug.active && Config.debug.database.log_all_cache_queries)
                    {
                        Logger.log("Cache Query:\n");
                        Logger.log(JSON.stringify(query, null, 2));
                    }

                    if (isNull(err))
                    {
                        if (!isNull(result) && result instanceof Array && result.length > 0)
                        {
                            if (Config.cache.active && Config.debug.cache.log_cache_hits)
                            {
                                Logger.log("Cache HIT (Ratio " + self.getHitRatio() + ") on " + JSON.stringify(query) + "\n");
                                // Logger.log("Cached : \n " + JSON.stringify(result, null, 4));
                            }
                            self.hits++;
                            return callback(null, result[0]);
                        }

                        if (Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            Logger.log("Cache MISS (Ratio " + self.getHitRatio() + ") on " + JSON.stringify(query));
                        }

                        self.misses++;
                        return callback(null, null);
                    }

                    Logger.log("error", "Error running query: " + JSON.stringify(query, null, 4));
                    Logger.log("error", err.stack);
                    return callback(err, "Unable to execute query " + JSON.stringify(query) + " from neDB cache.");
                });
            }
            else
            {
                return callback(1, "Tried to fetch a resource from cache " + JSON.stringify(self) + " providing a null resourceUri!");
            }
        }
        else
        {
            return callback(1, "Must open connection to NeDB cache " + JSON.stringify(self) + "first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

NeDBCache.prototype.get = function (resourceUri, callback)
{
    const self = this;
    self.getByQuery({ uri: resourceUri }, function (err, result)
    {
        if (isNull(err))
        {
            if (!isNull(result))
            {
                callback(null, result);
            }
            else
            {
                return callback(null, null);
            }
        }
        else
        {
            return callback(err, result);
        }
    });
};

NeDBCache.prototype.delete = function (resourceUriOrArrayOfResourceUris, callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(resourceUriOrArrayOfResourceUris))
            {
                let filterObject;
                if (resourceUriOrArrayOfResourceUris instanceof Array && resourceUriOrArrayOfResourceUris.length > 0)
                {
                    filterObject = {
                        $or: []
                    };

                    for (let i = 0; i < resourceUriOrArrayOfResourceUris.length; i++)
                    {
                        filterObject.$or.push({
                            uri: resourceUriOrArrayOfResourceUris[i]
                        });
                    }
                }
                else if (typeof resourceUriOrArrayOfResourceUris === "string")
                {
                    filterObject = {
                        uri: resourceUriOrArrayOfResourceUris
                    };
                }

                const options = {};
                self.client.remove(filterObject,
                    options,
                    function (err)
                    {
                        if (isNull(err))
                        {
                            if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                            {
                                Logger.log("debug", "Deleted neDB cache records for " + JSON.stringify(resourceUriOrArrayOfResourceUris));
                            }

                            return callback(null, null);
                        }

                        const msg = "Unable to delete resource " + resourceUriOrArrayOfResourceUris + " from NeDB cache " + JSON.stringify(self.id) + "\n" + err;
                        Logger.log(msg);
                        return callback(err, msg);
                    }
                );
            }
            else
            {
                return callback(1, "Tried to fetch a resource from cache " + JSON.stringify(self) + " providing a null resourceUri array!");
            }
        }
        else
        {
            return callback(1, "Must open connection to NeDB cache " + JSON.stringify(self) + "first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

NeDBCache.prototype.deleteByQuery = function (queryObject, callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            const options = {
                multi: true
            };

            self.client.remove(queryObject,
                options,
                function (err, numRemoved)
                {
                    if (isNull(err))
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                        {
                            Logger.log("debug", "Deleted neDB cache records for " + JSON.stringify(queryObject));
                        }

                        return callback(null, numRemoved);
                    }

                    Logger.log("error", JSON.stringify(err, null, 4));
                    Logger.log("error", JSON.stringify(queryObject, null, 4));
                    return callback(err, numRemoved);
                });
        }
        else
        {
            return callback(1, "Must open connection to NeDB cache " + JSON.stringify(self) + "first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

NeDBCache.prototype.deleteAllByType = function (typeOrTypesArray, callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(typeOrTypesArray))
            {
                let queryObject;
                if (typeOrTypesArray instanceof Array)
                {
                    queryObject = {
                        rdf:
                        {
                            type:
                          {
                              $and: []
                          }
                        }
                    };

                    for (let i = 0; i < typeOrTypesArray.length; i++)
                    {
                        queryObject.rdf.type.$and.push(typeOrTypesArray[i]);
                    }
                }
                else if (typeof typeOrTypesArray === "string")
                {
                    queryObject = {
                        rdf: {
                            type: typeOrTypesArray
                        }
                    };
                }

                self.deleteByQuery(queryObject, callback);
            }
            else
            {
                return callback(1, "Tried to fetch a resource from cache " + JSON.stringify(self) + " providing a null resourceUri array!");
            }
        }
        else
        {
            return callback(1, "Must open connection to NeDB cache " + JSON.stringify(self) + "first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

NeDBCache.prototype.deleteAll = function (callback)
{
    const self = this;

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            self.deleteByQuery({}, function (err, numRemoved)
            {
                if (isNull(err) || err.message === "ns not found")
                {
                    if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                    {
                        Logger.log("debug", "Deleted " + numRemoved + " cache records");
                    }

                    return callback(null, numRemoved);
                }
                const msg = "Unable to delete all resources in nedb cache " + self.id + " : " + JSON.stringify(err);
                Logger.log(msg);
                return callback(err, msg);
            });
        }
        else
        {
            return callback(1, "Must open connection to NeDB cache " + JSON.stringify(self) + "first!");
        }
    }
    else
    {
        return callback(null, null);
    }
};

NeDBCache.default = {};

NeDBCache.type = "neDB";

module.exports.NeDBCache = NeDBCache;
