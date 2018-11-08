const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const RedisCache = rlequire("dendro", "src/kb/cache/caches/redis.js").RedisCache;
const MongoDBCache = rlequire("dendro", "src/kb/cache/caches/mongodb.js").MongoDBCache;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const async = require("async");

const Cache = function ()
{

};

Cache.initConnections = function (callback)
{
    const _ = require("underscore");

    let keys = _.filter(Object.keys(Config.db), function (key)
    {
        return Config.db.hasOwnProperty(key);
    });

    async.mapSeries(keys,
        function (key, callback)
        {
            const dbConfig = Config.db[key];

            if (!isNull(dbConfig.cache))
            {
                const cacheType = dbConfig.cache.type;
                const cacheId = dbConfig.cache.id;
                const graphUri = dbConfig.graphUri;

                if (!isNull(graphUri))
                {
                    if (!isNull(cacheId))
                    {
                        switch (cacheType)
                        {
                        case MongoDBCache.type : {
                            let mongoCacheConfig = Config.cache.mongodb.instances[cacheId];
                            if (Config.cache.mongodb.active && !isNull(mongoCacheConfig))
                            {
                                const newMongoCacheConnection = new MongoDBCache(mongoCacheConfig);
                                async.retry({
                                    times: 240,
                                    interval: function (retryCount)
                                    {
                                        const msecs = 500;
                                        Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to MongoDB Cache " + cacheId + "...");
                                        return msecs;
                                    }
                                },
                                function (callback)
                                {
                                    Logger.log("debug", "Trying to connect to MongoDB Cache " + cacheId);
                                    newMongoCacheConnection.open(function (err, mongoDBConnection)
                                    {
                                        if (!isNull(err))
                                        {
                                            Logger.log("warn", "Unable to connect to MongoDB cache service!!");
                                            Logger.log("warn", "Mongodb connection Error: " + JSON.stringify(err));
                                            Logger.log("warn", "Mongodb connection Returned Object: " + JSON.stringify(mongoDBConnection));
                                            callback(err);
                                        }
                                        else
                                        {
                                            Logger.log_boot_message("Connected to MongoDB cache service with ID : " + mongoDBConnection.id + " running on " + mongoDBConnection.host + ":" + mongoDBConnection.port);

                                            if (mongoCacheConfig.clear_on_startup)
                                            {
                                                newMongoCacheConnection.deleteAll(function (err, result)
                                                {
                                                    if (isNull(err))
                                                    {
                                                        Cache.caches[cacheId] = newMongoCacheConnection;
                                                        Cache.cachesByGraphUri[graphUri] = newMongoCacheConnection;

                                                        callback(null, newMongoCacheConnection);
                                                    }
                                                    else
                                                    {
                                                        throw new Error("[ERROR] Unable to delete all cache records on MongoDB instance \"" + newMongoCacheConnection.id + "\" during bootup:\n" + JSON.stringify(result));
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                Cache.caches[cacheId] = newMongoCacheConnection;
                                                Cache.cachesByGraphUri[graphUri] = newMongoCacheConnection;

                                                return callback(null, newMongoCacheConnection);
                                            }
                                        }
                                    });
                                }, function (err, newMongoCacheConnection)
                                {
                                    if (err)
                                    {
                                        Logger.log("error", "[ERROR] Unable to connect to MongoDB instance with ID: " + mongoCacheConfig.id + " running on " + mongoCacheConfig.host + ":" + mongoCacheConfig.port + " : " + err);
                                        Logger.log("error", newMongoCacheConnection);
                                    }
                                    else
                                    {
                                        Logger.log("Connected to MongoDB instance with ID: " + mongoCacheConfig.id + " running on " + mongoCacheConfig.host + ":" + mongoCacheConfig.port);
                                    }
                                    return callback(err, newMongoCacheConnection);
                                });
                            }

                            break;
                        }
                        case RedisCache.type : {
                            let redisCacheConfig = Config.cache.redis.instances[cacheId];
                            if (Config.cache.redis.active && !isNull(redisCacheConfig))
                            {
                                const newRedisCacheConnection = new RedisCache(redisCacheConfig);

                                newRedisCacheConnection.open(function (err, newRedisConnection)
                                {
                                    if (!isNull(err))
                                    {
                                        throw new Error("[ERROR] Unable to connect to Redis instance with ID: " + redisCacheConfig.id + " running on " + redisCacheConfig.host + ":" + redisCacheConfig.port + " : " + err.message);
                                    }
                                    else
                                    {
                                        Logger.log("Connected to Redis cache service with ID : " + newRedisConnection.id + " running on " + newRedisConnection.host + ":" + newRedisConnection.port);

                                        newRedisCacheConnection.deleteAll(function (err, result)
                                        {
                                            if (isNull(err))
                                            {
                                                Logger.log("Deleted all cache records on Redis instance " + newRedisConnection.id);
                                                Cache.caches[cacheId] = newRedisConnection;
                                                Cache.cachesByGraphUri[graphUri] = newRedisConnection;
                                                return callback(null, newRedisConnection);
                                            }
                                            throw new Error("[ERROR] Unable to delete all cache records on Redis instance \"" + cacheId + "\" during bootup");
                                        });
                                    }
                                });
                            }
                            else
                            {
                                return callback(null, "Redis cache is not active or there is no redis cache config active with ID " + cacheId);
                            }

                            break;
                        }
                        default:
                        {
                            throw new Error("Unrecognized cache type " + cacheType + ". Please review your deployment_configs.json file.");
                        }
                        }
                    }
                    else
                    {
                        throw new Error("Cache was set for graph " + graphUri + " but no cache id was configured. Please review the config.js file.");
                    }
                }
                else
                {
                    throw new Error("There was an error parametrizing the caches for graph " + graphUri + " .This is a bug. Please review the config.json file.");
                }
            }
            else
            {
                callback(null);
            }
        },
        function (err, results)
        {
            if (isNull(err))
            {
                Logger.log_boot_message("All Cache instances are up and running!");
                callback(null);
            }
            else
            {
                throw new Error("[ERROR] Unable to setup some cache instances. Is the MongoDB server online?\n");
            }
        }
    );
};

Cache.closeConnections = function (cb)
{
    let self = this;

    async.mapSeries(Object.keys(self.caches), function (cacheKey, cb)
    {
        if (self.caches.hasOwnProperty(cacheKey))
        {
            if (!isNull(self.caches[cacheKey]) && typeof self.caches[cacheKey].getHitRatio === "function")
            {
                Logger.log("info", "Cache " + self.caches[cacheKey].id + " HIT RATIO: " + self.caches[cacheKey].getHitRatio());
            }

            self.caches[cacheKey].close(function (err, result)
            {
                if (isNull(err))
                {
                    Logger.log("info", "Cache " + self.caches[cacheKey].id + " HIT RATIO: " + self.caches[cacheKey].getHitRatio());
                }
                else
                {
                    Logger.log("error", "Error closing connection to cache" + self.caches[cacheKey].id);
                    Logger.log("error", JSON.stringify(err));
                    Logger.log("error", JSON.stringify(result));
                }
                cb(err, result);
                // self.caches[cacheKey] = null;
            });
        }
        else
        {
            cb(null, null);
        }
    }, function (err, results)
    {
        cb(err, results);
    });
};

Cache.getByID = function (cacheId)
{
    if (isNull(cacheId))
    {
        return Cache.caches.default;
    }
    else if (!isNull(Cache.caches[cacheId]))
    {
        return Cache.caches[cacheId];
    }
    throw new Error("Invalid cache identifier : " + cacheId);
};

Cache.getByGraphUri = function (graphUri)
{
    if (isNull(graphUri))
    {
        return Cache.caches.default;
    }
    else if (!isNull(Cache.cachesByGraphUri[graphUri]))
    {
        return Cache.cachesByGraphUri[graphUri];
    }
    throw new Error("Invalid graph uri when fetching cache : " + graphUri);
};

Cache.deleteAllRecordsOfAllCaches = function (callback)
{
    async.mapSeries(Cache.caches, function (cache, callback)
    {
        cache.deleteAll(callback);
    }, function (err, results)
    {
        callback(err, results);
    });
};

Cache.caches = {};
Cache.cachesByGraphUri = {};

module.exports.Cache = Cache;
